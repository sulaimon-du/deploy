/* Слой подключения: заменяет window.claude из claude.ai.
   db     -> Supabase (таблица kv) либо localStorage, если Supabase не настроен
   sample -> Anthropic Messages API напрямую из браузера (ключ пользователя) */
(function(){
  "use strict";
  var CFG_KEY = "atelier.cfg.v1";
  var DEFAULTS = {supaUrl:"", supaKey:"", anthropicKey:"", modelDefault:"claude-sonnet-5", modelQuick:"claude-haiku-4-5-20251001"};

  function getCfg(){
    try{ return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(CFG_KEY) || "{}")); }
    catch(e){ return Object.assign({}, DEFAULTS); }
  }
  function setCfg(patch){
    var c = Object.assign(getCfg(), patch);
    try{ localStorage.setItem(CFG_KEY, JSON.stringify(c)); }catch(e){}
    return c;
  }
  function cloud(){ var c = getCfg(); return !!(c.supaUrl && c.supaKey); }
  function err(code, message){ return {code: code, message: message || code}; }
  function clone(x){ return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

  // ---------- local store (fallback + read cache) ----------
  var LOCAL = "atelier.kv.", MIRROR = "atelier.mirror.";
  function lsGet(k){ try{ var v = localStorage.getItem(k); return v === null ? undefined : JSON.parse(v); }catch(e){ return undefined; } }
  function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
  function lsKeys(prefix){
    var out = [];
    try{ for (var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); if (k.indexOf(prefix) === 0) out.push(k.slice(prefix.length)); } }catch(e){}
    return out;
  }

  // ---------- Supabase (PostgREST, table kv(key text pk, value jsonb, updated_at)) ----------
  function base(){ return getCfg().supaUrl.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "").replace(/\/+$/, "") + "/rest/v1/kv"; }
  function hdr(extra){
    var c = getCfg();
    return Object.assign({apikey: c.supaKey, Authorization: "Bearer " + c.supaKey, "Content-Type": "application/json"}, extra || {});
  }
  async function supaFetch(url, init){
    var r;
    try{ r = await fetch(url, init); }catch(e){ throw err("network", "нет связи с Supabase"); }
    if (!r.ok){
      var t = ""; try{ t = await r.text(); }catch(e){}
      if (r.status === 404 || /relation .* does not exist|PGRST205/.test(t)) throw err("no_table", "таблица kv не найдена — выполните SQL из SETUP.md");
      if (r.status === 401 || r.status === 403) throw err("supa_auth", "Supabase отклонил ключ");
      throw err("supa_error", "Supabase " + r.status + " " + t.slice(0, 120));
    }
    return r;
  }
  async function cloudGet(key){
    var r = await supaFetch(base() + "?select=value&key=eq." + encodeURIComponent(key), {headers: hdr()});
    var rows = await r.json();
    return rows.length ? rows[0].value : undefined;
  }
  async function cloudSet(key, value){
    await supaFetch(base(), {method: "POST", headers: hdr({Prefer: "resolution=merge-duplicates,return=minimal"}),
      body: JSON.stringify({key: key, value: value, updated_at: new Date().toISOString()})});
  }
  async function cloudList(prefix){
    var r = await supaFetch(base() + "?select=key,value&key=like." + encodeURIComponent(prefix + "/") + "*", {headers: hdr()});
    return (await r.json()).map(function(row){ return {key: row.key, value: row.value}; });
  }

  // ---------- unified doc/collection API (same shape the app already uses) ----------
  window.__atelierStale = false;
  async function kvGet(path){
    if (!cloud()) return lsGet(LOCAL + path);
    try{
      var v = await cloudGet(path);
      window.__atelierStale = false;
      if (v !== undefined) lsSet(MIRROR + path, v);
      return v;
    }catch(e){
      var m = lsGet(MIRROR + path);
      if (m !== undefined && e.code === "network"){ window.__atelierStale = true; return m; }
      throw e;
    }
  }
  async function kvSet(path, value){
    if (!cloud()){ if (!lsSet(LOCAL + path, value)) throw err("storage_full", "локальное хранилище заполнено"); return; }
    await cloudSet(path, value);
    lsSet(MIRROR + path, value);
  }
  async function kvList(prefix){
    if (!cloud()) return lsKeys(LOCAL + prefix + "/").map(function(k){ return {key: prefix + "/" + k, value: lsGet(LOCAL + prefix + "/" + k)}; });
    try{
      var rows = await cloudList(prefix);
      lsSet(MIRROR + "list." + prefix, rows);
      return rows;
    }catch(e){
      var m = lsGet(MIRROR + "list." + prefix);
      if (m !== undefined && e.code === "network"){ window.__atelierStale = true; return m; }
      throw e;
    }
  }
  function docRef(path){
    return {
      id: path.split("/").pop(), path: path,
      get: async function(){
        var v = await kvGet(path);
        return {id: path.split("/").pop(), exists: v !== undefined, data: function(){ return clone(v); }};
      },
      set: async function(d){ await kvSet(path, clone(d)); }
    };
  }
  var dbApi = {
    doc: docRef,
    collection: function(path){
      return {
        path: path,
        doc: function(id){ return docRef(path + "/" + id); },
        get: async function(){
          var rows = await kvList(path);
          var docs = rows.map(function(r){ return {id: r.key.split("/").pop(), exists: true, data: function(){ return clone(r.value); }}; });
          return {docs: docs, size: docs.length, empty: !docs.length};
        }
      };
    }
  };

  // ---------- Anthropic ----------
  function b64(file){
    return new Promise(function(res, rej){
      var fr = new FileReader();
      fr.onload = function(){ res(String(fr.result).split(",")[1] || ""); };
      fr.onerror = function(){ rej(err("image_rejected")); };
      fr.readAsDataURL(file);
    });
  }
  async function callAnthropic(input, opts){
    opts = opts || {};
    var c = getCfg();
    if (!c.anthropicKey) throw err("no_key");
    var messages;
    if (typeof input === "string") messages = [{role: "user", content: input}];
    else messages = input.map(function(m){ return {role: m.role, content: m.content}; });
    if (opts.images){
      var files = Array.isArray(opts.images) ? opts.images : [opts.images];
      var blocks = [];
      for (var i = 0; i < files.length; i++){
        blocks.push({type: "image", source: {type: "base64", media_type: files[i].type, data: await b64(files[i])}});
      }
      var last = messages[messages.length - 1];
      messages[messages.length - 1] = {role: "user", content: blocks.concat([{type: "text", text: last.content}])};
    }
    var model = opts.modelTier === "quick" ? c.modelQuick : c.modelDefault;
    var r;
    try{
      r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {"x-api-key": c.anthropicKey, "anthropic-version": "2023-06-01",
                  "anthropic-dangerous-direct-browser-access": "true", "content-type": "application/json"},
        body: JSON.stringify({model: model, max_tokens: opts.maxTokens || 4096, messages: messages}),
        signal: opts.signal
      });
    }catch(e){
      if (e && e.name === "AbortError") throw err("cancelled");
      throw err("network", "нет связи с Anthropic");
    }
    if (!r.ok){
      var t = ""; try{ var j0 = await r.json(); t = (j0.error && j0.error.message) || ""; }catch(e){}
      if (r.status === 401 || r.status === 403) throw err("invalid_key", t);
      if (r.status === 429) throw err("rate_limited", t);
      if (r.status === 413) throw err("prompt_too_large", t);
      if (r.status === 400 && /credit balance/i.test(t)) throw err("no_credits", t);
      if (r.status === 404) throw err("bad_model", t);
      if (r.status === 400) throw err("invalid_request", t);
      throw err("upstream_error", t);
    }
    var j = await r.json();
    var text = (j.content || []).filter(function(b){ return b.type === "text"; }).map(function(b){ return b.text; }).join("");
    if (!text.trim()) throw err("empty_completion");
    return {text: text, truncated: j.stop_reason === "max_tokens", modelTierApplied: opts.modelTier === "quick" ? "quick" : "default", model: model};
  }
  async function sample(input, opts){
    var res = await callAnthropic(input, opts);
    if (opts && typeof opts.onText === "function"){ try{ opts.onText({text: res.text, delta: res.text}); }catch(e){} }
    return res;
  }
  function parseJsonTolerant(text){
    try{ return JSON.parse(text); }catch(e){}
    var fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence){ try{ return JSON.parse(fence[1]); }catch(e){} }
    var a = text.search(/[\[{]/), closeObj = text.lastIndexOf("}"), closeArr = text.lastIndexOf("]");
    var end = Math.max(closeObj, closeArr);
    if (a >= 0 && end > a){ try{ return JSON.parse(text.slice(a, end + 1)); }catch(e){} }
    throw new Error("parse");
  }
  sample.json = async function(input, opts){
    var res = await callAnthropic(input, opts);
    try{ return parseJsonTolerant(res.text); }
    catch(e){ var er = err("invalid_json", "ответ не разобран"); er.text = res.text; throw er; }
  };
  sample.limits = async function(){
    return {maxPromptBytes: 200000, images: {maxCount: 1, maxInputBytes: 5 * 1024 * 1024, mediaTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"]}};
  };

  window.claude = {use: async function(name){ if (name === "db") return dbApi; if (name === "sample") return sample; return null; }};

  // ---------- helpers for the Settings panel ----------
  window.__atelier = {
    getCfg: getCfg, setCfg: setCfg, cloud: cloud,
    testSupabase: async function(){
      if (!cloud()) throw err("no_supa", "адрес и ключ Supabase не заданы");
      await cloudGet("__ping__");
      return "подключено, таблица kv найдена";
    },
    testAnthropic: async function(){
      var r = await callAnthropic("Ответь одним словом: ок", {modelTier: "quick", maxTokens: 8});
      return "ключ принят (" + r.model + ")";
    }
  };
})();
