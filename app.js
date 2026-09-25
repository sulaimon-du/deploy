/* «Ателье карточек» 2.0 — интерфейс. Данные: window.claude.use("db"), ИИ: window.claude.use("sample") (core.js),
   промты: window.P (prompts.js). */
(function(){
  "use strict";
  const P = window.P;
  const A = window.__atelier;

  // ================================================================ утилиты
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const pad = n => String(n).padStart(2, "0");
  const isoLocal = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const todayIso = () => isoLocal(new Date());
  const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return isoLocal(d); };
  const MONTHS = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
  const WEEKDAYS = ["вс","пн","вт","ср","чт","пт","сб"];
  function fmtDate(iso, withWd){
    if (!iso) return "без даты";
    const d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return iso;
    const t = todayIso();
    if (iso === t) return "сегодня";
    if (iso === addDays(t, 1)) return "завтра";
    if (iso === addDays(t, -1)) return "вчера";
    return (withWd ? WEEKDAYS[d.getDay()] + ", " : "") + d.getDate() + " " + MONTHS[d.getMonth()];
  }
  function fmtAbs(iso){ const d = new Date(iso + "T12:00:00"); return isNaN(d) ? iso : d.getDate() + " " + MONTHS[d.getMonth()]; }
  const num = v => { const n = Number(String(v == null ? "" : v).replace(/\s/g, "").replace(",", ".")); return isFinite(n) ? n : 0; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lsGet = (k, d) => { try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } };
  const lsSet = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  const $ = (sel, root) => (root || document).querySelector(sel);

  // ================================================================ иконки (тонкая линия)
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    ideas: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/>',
    plus: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>',
    growth: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    chevron: '<path d="M9 5l7 7-7 7"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>'
  };
  const icon = (n, cls) => '<svg class="ic ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || "") + "</svg>";

  // ================================================================ состояние
  const S = {
    db: null, sample: null, online: true, loaded: false,
    slots: [], prompts: [], products: [], custom: {compositions:[], locations:[], light:[], angles:[], props:[], accentColors:[]},
    brand: {}, ideas: [], insights: {items: [], advice: [], summary: "", report: ""}, collabs: [], followers: [], competitors: [],
    thumbs: {}, lastImage: {}, busy: {}, undo: {}, queue: null,
    save: "ok", saveErr: "",
    ui: {
      feedView: lsGet("atelier.ui.feedView", "grid"), feedFilter: "all", postTab: "image", fresh: {},
      wiz: null, results: {}, copied: {}, navCount: 0, lastRoute: ""
    }
  };

  const cfg = () => A.getCfg();
  const hasKey = () => !!cfg().anthropicKey;
  const slotById = id => S.slots.find(s => s.id === id);
  const productById = id => S.products.find(p => p.id === id);
  const productOf = s => s && s.productId ? productById(s.productId) : null;
  const promptOf = s => s && s.linkedPromptId ? S.prompts.find(p => p.id === s.linkedPromptId) : null;
  const promptText = s => { const p = promptOf(s); return p ? p.text : ""; };
  const hasThumb = s => !!S.thumbs[s.id];
  const hasMetrics = s => !!(s.metrics && num(s.metrics.reach));
  const allList = k => (P.BASE[k] || []).concat(S.custom[k] || []);
  const rubricsOf = () => (S.brand.rubrics && S.brand.rubrics.length ? S.brand.rubrics : P.DEFAULT_RUBRICS);
  const hasTextMode = t => t === "HERO" || t === "QUOTE" || t === "CAROUSEL";
  const effTextMode = s => hasTextMode(s.pillarType) ? (s.textMode || (s.pillarType === "HERO" ? "B" : "A")) : "A";

  function normalizeSlot(s){
    s = s || {};
    const now = new Date().toISOString();
    return {
      id: s.id || uid(), num: Number(s.num) || 0,
      date: s.date || "", time: s.time || "",
      pillarType: P.PILLARS[s.pillarType] ? s.pillarType : "HERO",
      trial: !!s.trial, rubric: s.rubric || "", goal: P.GOALS[s.goal] ? s.goal : "",
      productId: s.productId || "", note: s.note || "", event: s.event || "",
      linkedPromptId: s.linkedPromptId || null, promptIds: Array.isArray(s.promptIds) ? s.promptIds : [],
      defaults: s.defaults && typeof s.defaults === "object" ? s.defaults : null,
      scene: s.scene && typeof s.scene === "object" ? s.scene : null,
      textMode: s.textMode === "A" || s.textMode === "B" ? s.textMode : "",
      kicker: s.kicker || "", slogan: s.slogan || "",
      caption: s.caption || "", hashtags: Array.isArray(s.hashtags) ? s.hashtags : [],
      altText: s.altText || "", firstComment: s.firstComment || "", codeWord: s.codeWord || "", dmReply: s.dmReply || "",
      reelsScript: s.reelsScript || "", storiesPlan: s.storiesPlan || "", layoutText: s.layoutText || "",
      qa: s.qa || null, imageAt: s.imageAt || "", publishedAt: s.publishedAt || "",
      metrics: s.metrics && typeof s.metrics === "object" ? s.metrics : {}, testResult: s.testResult || "",
      createdAt: s.createdAt || now, updatedAt: s.updatedAt || s.createdAt || now
    };
  }

  // Старые планы хранились новыми карточками вперёд и без номеров: нумеруем по возрасту, храним по порядку.
  function migrateSlots(raw){
    const list = (raw || []).map(normalizeSlot);
    if (list.length && list.some(s => !s.num)){
      const ordered = list.slice().reverse();
      let n = Math.max(0, ...list.map(s => s.num));
      ordered.forEach(s => { if (!s.num) s.num = ++n; });
      return ordered;
    }
    return list;
  }

  function stage(s){
    if (hasMetrics(s)) return 5;
    if (s.publishedAt) return 4;
    if (hasThumb(s) || s.imageAt) return 3;
    if (s.caption) return 2;
    if (promptOf(s)) return 1;
    return 0;
  }
  const STAGES = ["Идея", "Промт", "Текст", "Картинка", "Опубликован", "Статистика"];

  // ================================================================ сохранение
  function setSave(state, err){
    S.save = state; S.saveErr = err ? P.errorText(err, "Не сохранено") : "";
    document.querySelectorAll("[data-save]").forEach(el => { el.outerHTML = saveBadge(); });
  }
  function saveBadge(){
    if (!S.online) return '<span class="save warn" data-save title="База недоступна">нет связи</span>';
    if (S.save === "saving") return '<span class="save" data-save>сохраняю…</span>';
    if (S.save === "err") return '<span class="save warn" data-save title="' + esc(S.saveErr) + '">не сохранено</span>';
    return '<span class="save ok" data-save>' + icon("check") + (A.cloud() ? "в облаке" : "на устройстве") + "</span>";
  }
  async function saveDoc(path, data){
    if (!S.online){ toast("База недоступна — изменения не сохранятся. Проверьте подключение.", true); return false; }
    setSave("saving");
    try{ await S.db.doc(path).set(data); setSave("ok"); return true; }
    catch(e){ setSave("err", e); toast(P.errorText(e, "Не удалось сохранить"), true); return false; }
  }
  let slotsTimer = null;
  function persistSlotsSoon(){ clearTimeout(slotsTimer); setSave("saving"); slotsTimer = setTimeout(persistSlots, 600); }
  function persistSlots(){ clearTimeout(slotsTimer); return saveDoc("plan/main", {slots: S.slots}); }
  const persistBrand = () => saveDoc("config/brand", S.brand);
  const persistProduct = p => saveDoc("products/" + p.id, p);
  const persistIdeas = () => saveDoc("config/ideas", {items: S.ideas});
  const persistInsights = () => saveDoc("config/insights", S.insights);
  const persistCollabs = () => saveDoc("config/collabs", {items: S.collabs});
  const persistFollowers = () => saveDoc("config/followers", {items: S.followers});
  const persistCompetitors = () => saveDoc("config/competitors", {items: S.competitors});
  const persistCustom = () => saveDoc("config/customLists", S.custom);
  const touch = s => { s.updatedAt = new Date().toISOString(); };

  async function setPrompt(s, text, source){
    const sc = s.scene || {};
    const doc = {id: uid(), slotId: s.id, pillarType: s.pillarType, text: text, scene: s.scene || null,
      compositionLabel: sc.composition || null, location: sc.location || null, angle: sc.angle || null,
      source: source || "ai", createdAt: new Date().toISOString()};
    S.prompts.unshift(doc);
    await saveDoc("prompts/" + doc.id, doc);
    s.linkedPromptId = doc.id;
    s.promptIds = [doc.id].concat(s.promptIds.filter(x => x !== doc.id)).slice(0, 10);
    touch(s);
    await persistSlots();
  }

  // ================================================================ ИИ
  const ai = (input, opts) => S.sample(input, Object.assign({cache: false}, opts || {}));
  const aiJson = (input, opts) => S.sample.json(input, Object.assign({cache: false}, opts || {}));
  function needKey(){
    if (hasKey()) return false;
    toast("Нужен ключ Claude — откройте Профиль → Подключение.", true);
    return true;
  }
  function setBusy(key, label){
    if (label) S.busy[key] = label; else delete S.busy[key];
    renderView(true);
  }
  const busy = key => S.busy[key];

  function usedScenes(exceptId){
    const out = S.slots.filter(s => s.id !== exceptId && s.scene)
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
      .map(s => Object.assign({pillarType: s.pillarType}, s.scene));
    if (out.length < 9){
      S.prompts.filter(p => (p.location || p.angle || p.compositionLabel) && !p.scene).slice(0, 9 - out.length)
        .forEach(p => out.push({pillarType: p.pillarType, location: p.location, angle: p.angle, composition: p.compositionLabel}));
    }
    return out.slice(0, 9);
  }
  function neighbors(s){
    const i = S.slots.indexOf(s);
    return [i - 1, i + 1].map(j => S.slots[j]).filter(Boolean).map(n => {
      const t = promptText(n);
      return P.slotLine(n) + (t ? "\nЕё промт (начало): " + t.slice(0, 700) : "");
    }).join("\n\n");
  }
  function recentFirstLines(exceptId){
    return S.slots.filter(s => s.id !== exceptId && s.caption).slice(-8).map(s => s.caption.split("\n")[0].slice(0, 120));
  }
  function templateFields(s){
    const p = productOf(s), d = s.defaults || {};
    const comp = d.composition ? allList("compositions").find(c => c.label === d.composition) : null;
    return {
      index: s.num, note: s.note, goal: s.goal, codeWord: s.codeWord, textMode: effTextMode(s),
      productName: p ? p.name : "", category: p ? p.category : "",
      height: p ? p.height : "", width: p ? p.width : "", depth: p ? p.depth : "",
      benefits: p ? (p.benefits || []).filter(Boolean) : [], distortions: p ? p.distortions : "",
      composition: comp, location: d.location || "", light: d.light || "", angle: d.angle || "",
      props: d.props || [], human: !!d.human, accentColor: d.accentColor || (p && p.accent) || "",
      kicker: s.kicker, slogan: s.slogan,
      repeatWarning: P.checkRepeat(s.pillarType, {composition: d.composition, location: d.location, angle: d.angle}, usedScenes(s.id))
    };
  }
  const buildTemplate = s => P.buildPromptText(s.pillarType, templateFields(s));
  const FATAL = {no_key:1, invalid_key:1, no_credits:1, network:1, bad_model:1, cancelled:1};

  async function makePrompt(s, wish){
    const template = buildTemplate(s);
    const res = await ai(P.createPromptRequest({slot: s, template, neighbors: neighbors(s), used: usedScenes(s.id), product: productOf(s), wish}), {maxTokens: 6000});
    const parsed = P.parseSceneLine(res.text);
    if (parsed.scene) s.scene = parsed.scene;
    await setPrompt(s, parsed.prompt || template, "ai");
  }
  async function makeCaption(s){
    const pack = await aiJson(P.captionPackRequest({slot: s, product: productOf(s), brand: S.brand, insights: S.insights.items,
      promptText: promptText(s), recentFirstLines: recentFirstLines(s.id)}), {maxTokens: 3000});
    if (!pack || typeof pack.caption !== "string" || !pack.caption.trim()) throw {code: "empty_completion"};
    s.caption = pack.caption.trim();
    s.hashtags = normTags(pack.hashtags);
    s.altText = String(pack.altText || "").trim();
    s.firstComment = String(pack.firstComment || "").trim();
    if (s.goal === "sales" || pack.codeWord){
      if (pack.codeWord) s.codeWord = String(pack.codeWord).trim().toUpperCase();
      if (pack.dmReply) s.dmReply = String(pack.dmReply).trim();
    }
    touch(s); await persistSlots();
  }
  async function makeReels(s, wish){
    const res = await ai(P.reelsRequest({slot: s, product: productOf(s), brand: S.brand, insights: S.insights.items, wish}), {maxTokens: 3500});
    s.reelsScript = res.text.trim(); touch(s); await persistSlots();
  }
  async function makeStories(s){
    const res = await ai(P.storiesRequest({slot: s, product: productOf(s), brand: S.brand, caption: s.caption}), {modelTier: "quick", maxTokens: 2500});
    s.storiesPlan = res.text.trim(); touch(s); await persistSlots();
  }
  async function makeLayout(s){
    const res = await ai(P.layoutRequest({slot: s, product: productOf(s), brand: S.brand, promptText: promptText(s)}), {modelTier: "quick", maxTokens: 1500});
    s.layoutText = res.text.trim(); touch(s); await persistSlots();
  }
  function normTags(t){
    const arr = Array.isArray(t) ? t : String(t || "").split(/[\s,]+/);
    return arr.map(x => String(x).trim()).filter(Boolean).map(x => x[0] === "#" ? x : "#" + x);
  }

  // o.redo — пересоздать всё заново; иначе дозаполнить недостающее. o.silent — без итогового сообщения (пакет).
  async function createAll(s, o){
    o = o || {};
    const key = "create:" + s.id;
    if (busy(key)) return;
    if (!hasKey()){
      if (!promptOf(s)){ await setPrompt(s, buildTemplate(s), "template"); }
      toast("Без ключа Claude собран шаблон промта. Для ИИ-сцены и текста добавьте ключ: Профиль → Подключение.", true);
      renderView(true); return false;
    }
    let failed = null;
    const steps = [];
    const need = v => o.redo || !v;
    if (need(promptOf(s))) steps.push(["Подбираю сцену и пишу промт…", async () => {
      try{ await makePrompt(s); }
      catch(e){ if (!promptOf(s)) await setPrompt(s, buildTemplate(s), "template"); throw e; }
    }]);
    if (need(s.caption)) steps.push(["Пишу подпись, хэштеги, alt-текст…", () => makeCaption(s)]);
    if (s.pillarType === "REELS" && need(s.reelsScript)) steps.push(["Пишу сценарий Reels…", () => makeReels(s)]);
    if ((s.pillarType === "HERO" || s.pillarType === "QUOTE") && effTextMode(s) === "B" && need(s.layoutText)) steps.push(["Готовлю текст для макета…", () => makeLayout(s)]);
    for (const [label, fn] of steps){
      setBusy(key, label);
      try{ await fn(); }
      catch(e){ failed = e; if (FATAL[e && e.code]) break; }
    }
    setBusy(key, null);
    if (failed) toast(P.errorText(failed, "Не всё получилось"), true);
    else if (!o.silent) toast("Готово: промт и текст. Скопируйте промт в ChatGPT.");
    return !failed;
  }

  async function runQueue(ids){
    S.queue = {ids: ids.slice(), i: 0, stop: false};
    renderView(true);
    for (; S.queue.i < S.queue.ids.length; S.queue.i++){
      if (S.queue.stop) break;
      const s = slotById(S.queue.ids[S.queue.i]);
      if (!s) continue;
      renderView(true);
      const ok = await createAll(s, {silent: true});
      if (ok === false && !hasKey()) break;
    }
    const done = S.queue.i;
    S.queue = null;
    toast("Готово постов: " + done + ".");
    renderView(true);
  }

  // ================================================================ картинки
  function loadImg(src){
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej({code: "image_rejected"}); im.src = src; });
  }
  async function resize(fileOrUrl, maxSide, quality){
    const url = typeof fileOrUrl === "string" ? fileOrUrl : URL.createObjectURL(fileOrUrl);
    try{
      const im = await loadImg(url);
      const k = Math.min(1, maxSide / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(im, 0, 0, c.width, c.height);
      const blob = await new Promise(r => c.toBlob(r, "image/jpeg", quality));
      return {blob, dataUrl: c.toDataURL("image/jpeg", quality), w: c.width, h: c.height};
    } finally { if (typeof fileOrUrl !== "string") URL.revokeObjectURL(url); }
  }
  const asFile = blob => new File([blob], "image.jpg", {type: "image/jpeg"});
  async function screenshotFile(file){ return asFile((await resize(file, 1600, 0.9)).blob); }

  // ================================================================ план
  function nextSchedule(){
    const perWeek = clamp(num(S.brand.postsPerWeek) || 5, 1, 14);
    const step = Math.max(1, Math.round(7 / perWeek));
    const dated = S.slots.filter(s => s.date).map(s => s.date).sort();
    const last = dated[dated.length - 1];
    const t = todayIso();
    const date = last && last >= t ? addDays(last, step) : addDays(t, 1);
    return {date, time: pickTime(S.slots.length)};
  }
  function times(){
    const t = String(S.brand.times || "12:30, 19:00").split(/[,;\s]+/).filter(x => /^\d{1,2}:\d{2}$/.test(x));
    return t.length ? t : ["12:30", "19:00"];
  }
  const pickTime = i => { const t = times(); return t[i % t.length]; };
  function defaultRubricGoal(type){
    const r = rubricsOf().find(r => (P.RUBRIC_TYPES[r.name] || []).indexOf(type) >= 0) || rubricsOf()[0];
    return {rubric: r ? r.name : "", goal: r ? r.goal : "saves"};
  }
  function newSlot(partial){
    const sch = nextSchedule();
    const type = partial && partial.pillarType || "HERO";
    const rg = defaultRubricGoal(type);
    const s = normalizeSlot(Object.assign({
      num: Math.max(0, ...S.slots.map(x => x.num)) + 1,
      date: sch.date, time: sch.time, pillarType: type, rubric: rg.rubric, goal: rg.goal,
      productId: type === "QUOTE" ? "" : (S.products[0] ? S.products[0].id : ""),
      note: P.NOTE_VARIANTS[type] ? P.NOTE_VARIANTS[type][0] : ""
    }, partial || {}));
    S.slots.push(s);
    return s;
  }
  function customEvents(){
    return String(S.brand.events || "").split("\n").map(l => {
      const m = l.trim().match(/^(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}|\d{1,2}\.\d{1,2})\s+(.+)$/);
      if (!m) return null;
      let date = m[1];
      if (/\./.test(date)){ const [d, mo] = date.split("."); date = pad(mo) + "-" + pad(d); }
      const [title, idea] = m[2].split(/\s+[—-]\s+/);
      return {date, title: title.trim(), idea: (idea || "").trim()};
    }).filter(Boolean);
  }

  async function generatePlan(){
    const w = S.ui.wiz;
    const n = clamp(Math.round(num(w.count)) || 5, 1, 30);
    const perWeek = clamp(num(w.perWeek) || 5, 1, 14);
    const start = w.start || addDays(todayIso(), 1);
    const tm = String(w.times || "").split(/[,;\s]+/).filter(x => /^\d{1,2}:\d{2}$/.test(x));
    const tlist = tm.length ? tm : times();
    const rubrics = P.assignRubrics(n, rubricsOf(), S.slots.slice(-20).map(s => s.rubric));
    let prev = S.slots.length ? S.slots[S.slots.length - 1].pillarType : null;
    const items = rubrics.map((r, i) => {
      const type = P.typeForRubric(r.name, prev); prev = type;
      return {type, rubric: r.name, goal: r.goal || "saves", date: addDays(start, Math.round(i * 7 / perWeek)), time: tlist[i % tlist.length]};
    });
    let k = 0;
    items.forEach(it => { if (it.type !== "QUOTE" && S.products.length){ it.productId = S.products[k % S.products.length].id; k++; } });
    const span = Math.round(n * 7 / perWeek) + 1;
    P.upcomingEvents(start, span + 30, customEvents()).forEach(ev => {
      const from = addDays(ev.date, -(ev.lead || 14));
      const cand = items.filter(it => !it.event && it.date >= from && it.date <= ev.date);
      const it = cand[cand.length - 1];
      if (it) it.event = ev.title + " (" + fmtAbs(ev.date) + ")" + (ev.idea ? ": " + ev.idea : "");
    });
    const used = {};
    S.slots.forEach(s => { used[s.note] = true; });
    items.forEach(it => {
      const pool = (P.NOTE_VARIANTS[it.type] || []).filter(x => !used[x]);
      const src = pool.length ? pool : P.NOTE_VARIANTS[it.type] || [""];
      it.note = src[Math.floor(Math.random() * src.length)]; used[it.note] = true;
    });
    if (w.ai && hasKey()){
      S.ui.wizBusy = "ИИ придумывает идеи…"; renderView(true);
      try{
        const arr = await aiJson(P.planIdeasRequest({
          items: items.map(it => ({type: it.type, rubric: it.rubric, goal: it.goal, event: it.event, productName: (productById(it.productId) || {}).name})),
          recent: S.slots.slice(-12).map(P.slotLine).join("\n"), brand: S.brand, insights: S.insights.items
        }), {modelTier: "quick", maxTokens: 2500});
        if (Array.isArray(arr)) arr.forEach((x, i) => { if (items[i] && typeof x === "string" && x.trim()) items[i].note = x.trim(); });
      }catch(e){ toast(P.errorText(e, "Идеи ИИ не получились — поставлены заготовки"), true); }
      S.ui.wizBusy = null;
    }
    const created = items.map(it => newSlot({pillarType: it.type, rubric: it.rubric, goal: it.goal, date: it.date, time: it.time,
      productId: it.productId || "", event: it.event || "", note: it.note}));
    await persistSlots();
    S.ui.fresh = {}; created.forEach(s => { S.ui.fresh[s.id] = true; });
    toast("Добавлено постов: " + created.length + ".");
    const createAllToo = w.createAll && hasKey();
    S.ui.wiz = null;
    go("feed");
    if (createAllToo) runQueue(created.map(s => s.id));
  }

  // ================================================================ статистика
  function statRows(){
    return S.slots.filter(hasMetrics).map(s => Object.assign({s}, P.rates(s.metrics)));
  }
  function avg(arr, f){ return arr.length ? Math.round(arr.reduce((a, x) => a + f(x), 0) / arr.length * 10) / 10 : 0; }
  function groupAvg(rows, keyFn){
    const g = {};
    rows.forEach(r => { const k = keyFn(r.s) || "—"; (g[k] = g[k] || []).push(r); });
    return Object.keys(g).map(k => ({k, n: g[k].length, saves: avg(g[k], r => r.savesPct), shares: avg(g[k], r => r.sharesPct), er: avg(g[k], r => r.er)}))
      .sort((a, b) => (b.saves + b.shares * 1.5) - (a.saves + a.shares * 1.5));
  }
  function postsForAI(rows){
    return rows.map(r => {
      const s = r.s, m = s.metrics;
      return P.slotLine(s) + " · " + (s.time || "") + " · охват " + m.reach + " · %сохр. " + r.savesPct + " · %перес. " + r.sharesPct + " · ER " + r.er + (m.watch ? " · досмотр " + m.watch : "")
        + (s.caption ? " · первая строка: " + s.caption.split("\n")[0].slice(0, 90) : "");
    }).join("\n");
  }

  // ================================================================ маршрутизация и отрисовка
  function route(){
    const h = location.hash.replace(/^#\/?/, "");
    const parts = h.split("/").map(decodeURIComponent);
    return {name: parts[0] || "feed", a: parts[1] || "", b: parts[2] || ""};
  }
  const go = path => { location.hash = "#/" + path; };
  function goBack(fallback){
    if (S.ui.navCount > 0 && history.length > 1){ history.back(); }
    else go(fallback || "feed");
  }

  function renderView(keepFocus){
    const view = $("#view");
    if (!view) return;
    const r = route();
    const routeKey = r.name + "/" + r.a;
    const sameRoute = routeKey === S.ui.lastRoute;
    let focus = null;
    const ae = document.activeElement;
    if (keepFocus && sameRoute && ae && view.contains(ae) && (ae.dataset.bind || ae.dataset.focusKey)){
      focus = {sel: ae.dataset.bind ? '[data-bind="' + ae.dataset.bind + '"]' : '[data-focus-key="' + ae.dataset.focusKey + '"]',
        s: ae.selectionStart, e: ae.selectionEnd};
    }
    const y = window.scrollY;
    let html;
    if (!S.loaded) html = '<div class="loading"><span class="spin"></span> Загружаю…</div>';
    else if (r.name === "post") html = viewPost(r.a);
    else if (r.name === "ideas") html = viewIdeas(r.a || "bank");
    else if (r.name === "growth") html = viewGrowth(r.a || "stats");
    else if (r.name === "profile") html = viewProfile(r.a, r.b);
    else if (r.name === "plan-new") html = viewPlanNew(r.a);
    else html = viewFeed();
    view.innerHTML = (S.online ? "" : '<div class="banner warn">База недоступна: показаны сохранённые на устройстве данные, изменения не сохраняются. Проверьте Профиль → Подключение.</div>') + html;
    document.querySelectorAll("#nav [data-nav]").forEach(a => {
      const on = a.dataset.nav === r.name || (a.dataset.nav === "feed" && (r.name === "post" || r.name === "plan-new"));
      a.classList.toggle("on", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    autosizeAll(view);
    if (sameRoute) window.scrollTo(0, y); else window.scrollTo(0, 0);
    S.ui.lastRoute = routeKey;
    if (focus){
      const el = $(focus.sel, view);
      if (el){ el.focus({preventScroll: true}); try{ if (focus.s != null) el.setSelectionRange(focus.s, focus.e); }catch(e){} }
    }
  }
  function autosize(el){ if (!el || el.tagName !== "TEXTAREA" || el.classList.contains("fixed")) return; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight + 2, el.classList.contains("collapsed") ? 190 : 4000) + "px"; }
  function autosizeAll(root){ root.querySelectorAll("textarea").forEach(autosize); }

  function topbar(title, o){
    o = o || {};
    return '<header class="topbar">'
      + (o.back ? '<button class="icon-btn" data-act="back" data-fallback="' + esc(o.back === true ? "feed" : o.back) + '" aria-label="Назад">' + icon("back") + "</button>" : "")
      + '<div class="tb-title"><h1>' + title + "</h1>" + (o.sub ? '<div class="tb-sub">' + o.sub + "</div>" : "") + "</div>"
      + saveBadge()
      + (o.more ? '<button class="icon-btn" data-act="' + o.more + '" aria-label="Ещё">' + icon("more") + "</button>" : "")
      + "</header>";
  }
  const opt = (v, label, cur) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? " selected" : "") + ">" + esc(label) + "</option>";
  const bindAttr = path => ' data-bind="' + esc(path) + '"';
  function copyBtn(text, label){
    return '<button class="btn sm" data-act="copy" data-text="' + esc(text) + '">' + icon("copy") + esc(label || "Копировать") + "</button>";
  }
  function aiOut(key, text){
    if (!text) return "";
    return '<div class="ai-out"><div class="ai-text">' + esc(text) + '</div><div class="row">' + copyBtn(text) + "</div></div>";
  }
  function btnBusy(key, label, act, attrs, cls){
    const b = busy(key);
    return '<button class="btn ' + (cls || "") + '" data-act="' + act + '"' + (attrs || "") + (b ? " disabled" : "") + ">"
      + (b ? '<span class="spin"></span>' + esc(b) : label) + "</button>";
  }
  function queueBanner(){
    if (!S.queue) return "";
    const q = S.queue;
    return '<div class="banner queue"><span class="spin"></span><span>Создаю промты и тексты: ' + Math.min(q.i + 1, q.ids.length) + " из " + q.ids.length
      + '</span><button class="btn sm" data-act="stopQueue">' + (q.stop ? "Останавливаю…" : "Стоп") + "</button></div>";
  }

  // ---------------------------------------------------------------- Лента
  function onboardingCard(){
    if (lsGet("atelier.onboard.hide", false)) return "";
    const steps = [
      [hasKey(), "Вставьте ключ Claude", "profile/connect", "чтобы ИИ писал промты и тексты"],
      [!!S.brand.name, "Расскажите о бренде", "profile/brand", "тон, аудитория, ключевые слова"],
      [S.products.length > 0, "Добавьте товар", "profile/products", "размеры и преимущества — ИИ ничего не выдумает"],
      [S.slots.length > 0, "Создайте план", "plan-new/week", "неделя постов в один клик"]
    ];
    const done = steps.filter(x => x[0]).length;
    if (done === steps.length) return "";
    return '<section class="card onboard"><div class="row between"><h2>Начало работы · ' + done + " из " + steps.length + '</h2><button class="icon-btn sm" data-act="hideOnboard" aria-label="Скрыть">' + icon("x") + "</button></div>"
      + '<ol class="steps-list">' + steps.map((x, i) => '<li class="' + (x[0] ? "done" : "") + '"><a href="#/' + x[2] + '"><span class="n">' + (x[0] ? icon("check") : i + 1) + "</span><span><b>" + x[1] + "</b><small>" + x[3] + "</small></span>" + icon("chevron", "go") + "</a></li>").join("") + "</ol></section>";
  }
  function todayStrip(){
    const t = todayIso(), tm = addDays(t, 1);
    const items = [];
    S.slots.forEach(s => {
      if (s.publishedAt){ if (!hasMetrics(s) && s.publishedAt <= addDays(t, -1)) items.push([s, "внести статистику", "info"]); return; }
      if (!s.date) return;
      const ready = promptOf(s) && s.caption;
      if (s.date < t) items.push([s, "просрочен", "warn"]);
      else if (s.date === t) items.push([s, ready ? "публикуем сегодня" : "сегодня — не готов", ready ? "ok" : "warn"]);
      else if (s.date === tm) items.push([s, ready ? "завтра" : "завтра — не готов", ready ? "ok" : "info"]);
    });
    if (!items.length) return "";
    return '<section class="today"><h2 class="sec-h">Сегодня</h2><div class="hscroll">' + items.slice(0, 12).map(([s, label, kind]) =>
      '<a class="today-card ' + kind + '" href="#/post/' + esc(s.id) + '">' + thumbMini(s) + '<span><b>№' + s.num + " · " + esc(P.pillarOf(s.pillarType).label) + "</b><small>" + esc(label) + "</small></span></a>").join("") + "</div></section>";
  }
  function thumbMini(s){
    const th = S.thumbs[s.id];
    return th ? '<img class="mini" src="' + th + '" alt="">' : '<span class="mini tile-bg" style="--h:' + P.pillarOf(s.pillarType).hue + '">' + esc(P.pillarOf(s.pillarType).short) + "</span>";
  }
  function feedFiltered(){
    const f = S.ui.feedFilter;
    return S.slots.filter(s => {
      const ready = !!(promptOf(s) && s.caption);
      if (f === "work") return !ready && !s.publishedAt;
      if (f === "ready") return ready && !s.publishedAt;
      if (f === "done") return !!s.publishedAt;
      return true;
    });
  }
  function viewFeed(){
    const name = S.brand.name || "Ателье карточек";
    let html = topbar(esc(name), {sub: S.brand.handle ? esc(S.brand.handle) : "план публикаций"}) + queueBanner() + onboardingCard() + todayStrip();
    if (!S.slots.length){
      return html + '<section class="empty"><div class="empty-ic">' + icon("grid") + '</div><h2>Плана пока нет</h2><p>Создайте неделю постов — приложение само расставит типы по ритму, рубрики и цели, подберёт поводы и придумает идеи.</p>'
        + '<a class="btn primary" href="#/plan-new/week">' + icon("spark") + 'План на неделю</a><button class="btn" data-act="newPost">Один пост</button></section>';
    }
    const list = feedFiltered();
    const filters = [["all", "Все"], ["work", "В работе"], ["ready", "Готовы"], ["done", "Опубликованы"]];
    html += '<div class="toolbar"><div class="seg" role="tablist">'
      + '<button class="' + (S.ui.feedView === "grid" ? "on" : "") + '" data-act="feedView" data-v="grid" aria-label="Сетка">' + icon("grid") + "</button>"
      + '<button class="' + (S.ui.feedView === "list" ? "on" : "") + '" data-act="feedView" data-v="list" aria-label="Список">' + icon("list") + "</button></div>"
      + '<div class="chips">' + filters.map(([k, l]) => '<button class="chip ' + (S.ui.feedFilter === k ? "on" : "") + '" data-act="feedFilter" data-v="' + k + '">' + l + "</button>").join("") + "</div></div>";
    if (!list.length) return html + '<p class="muted center pad">Здесь пока пусто.</p>';
    if (S.ui.feedView === "grid"){
      html += '<div class="grid3">' + list.slice().reverse().map(tile).join("") + "</div>"
        + '<p class="hint center">Сетка показывает, как посты лягут в профиль: сверху — самые поздние. Превью обрезано до 3:4, как в Instagram.</p>';
    } else {
      html += '<div class="plist">' + list.map((s, i) => {
        const prev = list[i - 1];
        const warn = prev && P.pillarOf(prev.pillarType).density === "dense" && P.pillarOf(s.pillarType).density === "dense" && S.slots.indexOf(prev) === S.slots.indexOf(s) - 1
          ? '<div class="rhythm">⚠ Два плотных поста подряд (№' + prev.num + " → №" + s.num + ") — поставьте между ними Mood, Деталь, Цитату или Reels.</div>" : "";
        return warn + row(s);
      }).join("") + "</div>";
    }
    return html;
  }
  function stageDots(s){
    const st = stage(s);
    return '<span class="dots" title="' + esc(STAGES[st]) + '">' + [1, 2, 3, 4].map(i => '<i class="' + (st >= i ? "on" : "") + '"></i>').join("") + "</span>";
  }
  function tile(s){
    const pl = P.pillarOf(s.pillarType), th = S.thumbs[s.id];
    const b = busy("create:" + s.id);
    return '<a class="tile ' + (S.ui.fresh[s.id] ? "fresh" : "") + '" href="#/post/' + esc(s.id) + '" style="--h:' + pl.hue + '">'
      + (th ? '<img src="' + th + '" alt="">' : '<span class="tile-bg"><span class="tile-type">' + esc(pl.label) + '</span><span class="tile-note">' + esc(P.clip(s.note, 70)) + "</span></span>")
      + '<span class="tile-top">№' + s.num + (s.pillarType === "REELS" ? " " + icon("film") : s.pillarType === "CAROUSEL" ? " ❐" : "") + "</span>"
      + '<span class="tile-bot">' + esc(fmtDate(s.date)) + stageDots(s) + "</span>"
      + (b ? '<span class="tile-busy"><span class="spin"></span></span>' : "") + "</a>";
  }
  function row(s){
    const pl = P.pillarOf(s.pillarType), p = productOf(s);
    const b = busy("create:" + s.id);
    return '<a class="prow ' + (S.ui.fresh[s.id] ? "fresh" : "") + '" href="#/post/' + esc(s.id) + '">' + thumbMini(s)
      + '<span class="prow-main"><span class="prow-h"><b>№' + s.num + '</b><span class="badge" style="--h:' + pl.hue + '">' + esc(pl.label) + (s.trial ? " · тест" : "") + "</span>"
      + '<span class="muted">' + esc(fmtDate(s.date, true)) + (s.time ? " " + esc(s.time) : "") + "</span></span>"
      + '<span class="prow-note">' + esc(s.note || "без идеи") + "</span>"
      + '<span class="prow-meta">' + [s.rubric, P.goalLabel(s.goal), p ? p.name : "", s.event ? "повод" : ""].filter(Boolean).map(esc).join(" · ") + "</span></span>"
      + '<span class="prow-st">' + (b ? '<span class="spin"></span>' : '<small>' + STAGES[stage(s)] + "</small>" + stageDots(s)) + "</span></a>";
  }

  // ---------------------------------------------------------------- Пост
  function stepsBar(s){
    const st = stage(s);
    return '<ol class="stepper">' + STAGES.map((l, i) => '<li class="' + (i < st ? "done" : i === st ? "cur" : "") + '"><i>' + (i < st ? icon("check") : i + 1) + "</i><span>" + l + "</span></li>").join("") + "</ol>";
  }
  function nextAction(s){
    const b = busy("create:" + s.id);
    if (b) return '<button class="btn primary wide" disabled><span class="spin"></span>' + esc(b) + "</button>";
    const pt = promptText(s);
    if (!pt || !s.caption){
      return '<button class="btn primary wide" data-act="createAll" data-id="' + esc(s.id) + '">' + icon("spark") + (pt || s.caption ? "Доделать промт и текст" : "Создать промт и текст") + "</button>";
    }
    if (!hasThumb(s) && !s.imageAt){
      const copied = S.ui.copied[s.id];
      return (copied ? "" : '<button class="btn primary grow" data-act="copyPrompt" data-id="' + esc(s.id) + '">' + icon("copy") + "Промт → ChatGPT</button>")
        + '<label class="btn ' + (copied ? "primary grow" : "") + '">' + icon("upload") + (copied ? "Загрузить картинку из ChatGPT" : "Картинка") + '<input type="file" accept="image/*" hidden data-upload="image" data-id="' + esc(s.id) + '"></label>';
    }
    if (!s.publishedAt){
      return '<button class="btn grow" data-act="copyCaptionAll" data-id="' + esc(s.id) + '">' + icon("copy") + 'Подпись</button><button class="btn primary grow" data-act="publish" data-id="' + esc(s.id) + '">' + icon("check") + "Опубликован</button>";
    }
    if (!hasMetrics(s)) return '<button class="btn primary wide" data-act="postTab" data-v="stats">' + icon("growth") + "Внести статистику</button>";
    const i = S.slots.indexOf(s), nx = S.slots.slice(i + 1).find(x => !x.publishedAt);
    return nx ? '<a class="btn primary wide" href="#/post/' + esc(nx.id) + '">Следующий пост: №' + nx.num + " " + icon("chevron") + "</a>" : '<button class="btn wide" disabled>' + icon("check") + "Пост завершён</button>";
  }
  function viewPost(id){
    const s = slotById(id);
    if (!s) return topbar("Пост не найден", {back: true}) + '<p class="pad muted">Возможно, он был удалён.</p>';
    const pl = P.pillarOf(s.pillarType);
    const tab = S.ui.postTab;
    const tabs = [["image", "Картинка"], ["text", "Текст"], ["extra", s.pillarType === "REELS" ? "Reels · сторис" : "Сторис"], ["stats", "Итоги"]];
    const pane = tab === "text" ? paneText(s) : tab === "extra" ? paneExtra(s) : tab === "stats" ? paneStats(s) : paneImage(s);
    return topbar("№" + s.num + " · " + esc(pl.label), {back: true, sub: esc(fmtDate(s.date, true)) + (s.time ? " · " + esc(s.time) : ""), more: "postMenu"})
      + queueBanner() + stepsBar(s) + postHead(s)
      + '<nav class="tabs sticky" role="tablist">' + tabs.map(([k, l]) => '<button role="tab" class="' + (tab === k ? "on" : "") + '" data-act="postTab" data-v="' + k + '">' + l + "</button>").join("") + "</nav>"
      + '<div class="pane">' + pane + "</div>"
      + '<div class="cta-bar">' + nextAction(s) + "</div>";
  }
  function postHead(s){
    const id = s.id, pb = "slot:" + id + ":";
    const rubrics = rubricsOf();
    const rubricOpts = opt("", "— рубрика —", s.rubric) + rubrics.map(r => opt(r.name, r.name, s.rubric)).join("") + (s.rubric && !rubrics.find(r => r.name === s.rubric) ? opt(s.rubric, s.rubric, s.rubric) : "");
    const goalOpts = opt("", "— цель —", s.goal) + P.GOAL_KEYS.map(g => opt(g, P.GOALS[g].label, s.goal)).join("");
    const prodOpts = opt("", "— без товара —", s.productId) + S.products.map(p => opt(p.id, p.name || "без названия", s.productId)).join("") + opt("__new", "＋ Новый товар…", "");
    return '<section class="card post-head">'
      + '<div class="type-chips" role="radiogroup" aria-label="Тип карточки">' + P.TYPE_KEYS.map(t => '<button role="radio" aria-checked="' + (s.pillarType === t) + '" class="chip ' + (s.pillarType === t ? "on" : "") + '" data-act="slotSet" data-id="' + esc(id) + '" data-f="pillarType" data-v="' + t + '">' + esc(P.PILLARS[t].label) + "</button>").join("") + "</div>"
      + '<p class="hint">' + esc(P.TYPE_HELP[s.pillarType]) + "</p>"
      + (s.pillarType === "REELS" ? '<label class="check"><input type="checkbox"' + (s.trial ? " checked" : "") + bindAttr(pb + "trial") + ' data-rerender><span>Пробный Reels <small>— видят только неподписчики, для теста версий</small></span></label>' : "")
      + '<div class="field"><label>Идея поста</label><textarea rows="2" placeholder="Что в кадре или о чём пост"' + bindAttr(pb + "note") + ">" + esc(s.note) + "</textarea></div>"
      + '<details class="meta"' + (S.ui.metaOpen ? " open" : "") + ' data-act-toggle="metaOpen"><summary><span>' + esc(metaSummary(s)) + '</span><span class="link">Изменить</span></summary>'
      + '<div class="grid2">'
      + (s.pillarType === "QUOTE" ? "" : '<div class="field full"><label>Товар</label><select' + bindAttr(pb + "productId") + ' data-rerender>' + prodOpts + "</select></div>")
      + '<div class="field"><label>Цель</label><select' + bindAttr(pb + "goal") + ' data-rerender>' + goalOpts + "</select></div>"
      + '<div class="field"><label>Рубрика</label><select' + bindAttr(pb + "rubric") + ">" + rubricOpts + "</select></div>"
      + '<div class="field"><label>Дата</label><input type="date"' + bindAttr(pb + "date") + ' value="' + esc(s.date) + '" data-rerender></div>'
      + '<div class="field"><label>Время</label><input type="time"' + bindAttr(pb + "time") + ' value="' + esc(s.time) + '" data-rerender></div>'
      + "</div></details>"
      + (s.event ? '<p class="event">Повод: ' + esc(s.event) + ' <button class="link" data-act="slotSet" data-id="' + esc(id) + '" data-f="event" data-v="">убрать</button></p>' : "")
      + "</section>";
  }
  function metaSummary(s){
    const p = productOf(s);
    return [s.pillarType === "QUOTE" ? "" : (p ? p.name || "товар" : "без товара"), P.goalLabel(s.goal) || "без цели", s.rubric || "без рубрики",
      s.date ? fmtDate(s.date, true) + (s.time ? " " + s.time : "") : "без даты"].filter(Boolean).join(" · ");
  }
  function refineBar(kind, s, field){
    const key = "refine:" + s.id + ":" + (field || kind);
    const b = busy(key);
    const undo = S.undo[s.id + ":" + (field || kind)];
    return '<div class="refine" data-refine="' + esc(field || kind) + '">'
      + '<div class="chips">' + (P.QUICK_WISHES[kind] || []).map(w => '<button class="chip" data-act="refine" data-id="' + esc(s.id) + '" data-kind="' + kind + '" data-field="' + esc(field || kind) + '" data-wish="' + esc(w) + '"' + (b ? " disabled" : "") + ">" + esc(w) + "</button>").join("") + "</div>"
      + '<div class="row nowrap"><input type="text" placeholder="Своё пожелание ИИ…" data-focus-key="' + esc(key) + '" data-refine-input>'
      + '<button class="btn" data-act="refine" data-id="' + esc(s.id) + '" data-kind="' + kind + '" data-field="' + esc(field || kind) + '"' + (b ? " disabled" : "") + ">" + (b ? '<span class="spin"></span>' : icon("spark")) + "Доработать</button>"
      + (undo !== undefined ? '<button class="icon-btn" data-act="undo" data-id="' + esc(s.id) + '" data-field="' + esc(field || kind) + '" aria-label="Отменить">' + icon("undo") + "</button>" : "")
      + "</div></div>";
  }
  function sceneSummary(s){
    const sc = s.scene;
    if (!sc) return "";
    return '<p class="scene">Сцена: ' + [sc.location, sc.light, sc.angle, sc.props, sc.composition].filter(Boolean).map(esc).join(" · ") + "</p>";
  }
  function paneImage(s){
    const pt = promptText(s), p = productOf(s), id = s.id;
    let h = "";
    if (!pt){
      h += '<div class="explain">' + icon("spark", "big") + "<p><b>Одна кнопка — и всё готово.</b> Приложение соберёт промт по шаблону серии, ИИ подберёт сцену, не повторяя прошлые посты, и сразу напишет подпись, хэштеги и alt-текст. Потом можно доработать любой блок.</p></div>";
    } else {
      h += '<section class="block"><div class="block-h"><h3>Промт для ChatGPT</h3><button class="link" data-act="togglePrompt">' + (S.ui.promptOpen ? "Свернуть" : "Развернуть") + "</button></div>"
        + sceneSummary(s)
        + '<textarea class="mono ' + (S.ui.promptOpen ? "" : "collapsed") + '" data-prompt-edit="' + esc(id) + '" data-focus-key="prompt:' + esc(id) + '" spellcheck="false">' + esc(pt) + "</textarea>"
        + '<div class="row">' + '<button class="btn primary sm" data-act="copyPrompt" data-id="' + esc(id) + '">' + icon("copy") + "Копировать</button>"
        + '<a class="btn sm" href="https://chatgpt.com/" target="_blank" rel="noopener">' + icon("ext") + "Открыть ChatGPT</a>"
        + '<button class="btn sm" data-act="copyStory" data-id="' + esc(id) + '">9:16 для сторис</button></div>'
        + '<p class="hint">Приложите в ChatGPT: 1) ' + (s.pillarType === "QUOTE" ? "фото товара не нужно" : "фото товара" + (p ? " «" + esc(p.name) + "»" + (p.masterShot ? " — лучше мастер-кадр" : "") : "")) + "; 2) референс стиля" + (S.brand.refNote ? " — " + esc(S.brand.refNote) : " — лучшую прошлую карточку серии") + ".</p>"
        + refineBar("prompt", s) + "</section>";
    }
    if (hasTextMode(s.pillarType)){
      const m = effTextMode(s);
      h += '<section class="block"><h3>Текст на картинке</h3><div class="seg wide">'
        + '<button class="' + (m === "A" ? "on" : "") + '" data-act="slotSet" data-id="' + esc(id) + '" data-f="textMode" data-v="A">В генерации</button>'
        + '<button class="' + (m === "B" ? "on" : "") + '" data-act="slotSet" data-id="' + esc(id) + '" data-f="textMode" data-v="B">Наложу сам</button></div>'
        + '<p class="hint">' + (m === "B" ? "ChatGPT сделает сцену без букв, а текст вы наложите в Canva или Figma — так в нём не будет ошибок." : "Быстрее, но генератор иногда искажает русские буквы — проверьте картинку.") + (pt ? " После переключения пересоздайте промт." : "") + "</p>"
        + (m === "B" && s.pillarType !== "CAROUSEL" ? (s.layoutText
          ? '<textarea' + bindAttr("slot:" + id + ":layoutText") + ">" + esc(s.layoutText) + '</textarea><div class="row">' + copyBtn(s.layoutText, "Копировать макет") + "</div>" + refineBar("layout", s, "layoutText")
          : btnBusy("gen:" + id + ":layout", icon("spark") + "Текст и схема для макета", "gen", ' data-id="' + esc(id) + '" data-what="layout"', "sm")) : "")
        + "</section>";
    }
    h += sceneEditor(s);
    h += imageBlock(s);
    return h;
  }
  function sceneEditor(s){
    const d = s.defaults || {}, id = s.id, b = "slot:" + id + ":defaults.";
    const sel = (k, list, label) => '<div class="field"><label>' + label + "</label><select" + bindAttr(b + k) + ">" + opt("", "ИИ выберет", d[k] || "") + list.map(x => { const v = typeof x === "object" ? x.label : x; return opt(v, v, d[k] || ""); }).join("") + "</select></div>";
    const props = d.props || [];
    return '<details class="block"' + (S.ui.sceneOpen ? " open" : "") + ' data-act-toggle="sceneOpen"><summary><h3>Настроить сцену вручную</h3><span class="muted">необязательно</span></summary>'
      + '<p class="hint">Пустые поля выберет ИИ так, чтобы сцена не повторяла прошлые посты.</p><div class="grid2">'
      + (s.pillarType === "HERO" ? sel("composition", allList("compositions"), "Композиция") : "")
      + sel("location", allList("locations"), "Локация") + sel("light", allList("light"), "Свет") + sel("angle", allList("angles"), "Ракурс") + sel("accentColor", allList("accentColors"), "Акцентный цвет")
      + "</div>"
      + (s.pillarType !== "QUOTE" ? '<div class="field"><label>Реквизит</label><div class="chips wrap">' + allList("props").map(x => '<button class="chip ' + (props.indexOf(x) >= 0 ? "on" : "") + '" data-act="toggleProp" data-id="' + esc(id) + '" data-v="' + esc(x) + '">' + esc(x) + "</button>").join("") + "</div></div>"
        + '<label class="check"><input type="checkbox"' + (d.human ? " checked" : "") + bindAttr(b + "human") + "><span>Рука в кадре</span></label>" : "")
      + (s.pillarType === "HERO" ? '<div class="grid2"><div class="field"><label>Кикер</label><input type="text"' + bindAttr("slot:" + id + ":kicker") + ' value="' + esc(s.kicker) + '" placeholder="напр. «новинка сезона»"></div><div class="field"><label>Слоган снизу</label><input type="text"' + bindAttr("slot:" + id + ":slogan") + ' value="' + esc(s.slogan) + '"></div></div>' : "")
      + '<div class="row">' + btnBusy("gen:" + id + ":prompt", icon("spark") + "Новый промт с этой сценой", "gen", ' data-id="' + esc(id) + '" data-what="prompt"', "sm")
      + '<button class="btn sm" data-act="templateOnly" data-id="' + esc(id) + '">Собрать по шаблону без ИИ</button></div></details>';
  }
  function imageBlock(s){
    const th = S.thumbs[s.id], id = s.id, qa = s.qa;
    let h = '<section class="block"><h3>Картинка из ChatGPT</h3>';
    if (th){
      h += '<div class="img-wrap"><img src="' + th + '" alt="Картинка поста"></div><div class="row">'
        + '<label class="btn sm">' + icon("upload") + 'Заменить<input type="file" accept="image/*" hidden data-upload="image" data-id="' + esc(id) + '"></label>'
        + btnBusy("qa:" + id, icon("spark") + "Проверить картинку", "qa", ' data-id="' + esc(id) + '"', "sm")
        + '<button class="btn sm ghost" data-act="removeImage" data-id="' + esc(id) + '">' + icon("trash") + "</button></div>";
    } else {
      h += '<label class="drop">' + icon("image", "big") + "<span>Сделайте картинку в ChatGPT и загрузите сюда — она появится в сетке, и ИИ проверит её перед публикацией.</span>"
        + '<span class="btn sm">' + icon("upload") + 'Выбрать файл</span><input type="file" accept="image/*" hidden data-upload="image" data-id="' + esc(id) + '"></label>';
    }
    if (qa){
      h += '<div class="qa ' + (qa.verdict === "ok" ? "ok" : "redo") + '"><b>' + (qa.verdict === "ok" ? "✓ Готово к публикации" : "⚠ Стоит перегенерировать") + "</b>" + (qa.summary ? "<p>" + esc(qa.summary) + "</p>" : "")
        + '<ul class="checks">' + (qa.checks || []).map(c => '<li class="' + (c.ok ? "ok" : "bad") + '">' + (c.ok ? "✓" : "⚠") + " <b>" + esc(c.area) + "</b> — " + esc(c.note) + "</li>").join("") + "</ul>"
        + ((qa.fixes || []).length ? "<p><b>Правки для промта:</b></p><ul>" + qa.fixes.map(f => "<li>" + esc(f) + "</li>").join("") + "</ul>"
          + btnBusy("fix:" + id, icon("spark") + "Применить правки к промту", "applyFixes", ' data-id="' + esc(id) + '"', "sm") : "") + "</div>";
    }
    return h + "</section>";
  }
  function paneText(s){
    const id = s.id, b = "slot:" + id + ":";
    if (!s.caption && !busy("create:" + id)){
      return '<div class="explain">' + icon("spark", "big") + "<p>Подпись с ключевыми словами для поиска, призыв по цели поста, 5–10 хэштегов, alt-текст и первый комментарий — одним нажатием.</p>"
        + btnBusy("gen:" + id + ":caption", icon("spark") + "Написать текст", "gen", ' data-id="' + esc(id) + '" data-what="caption"', "primary") + "</div>";
    }
    const isReels = s.pillarType === "REELS";
    const len = s.caption.length, lo = isReels ? 200 : 400, hi = isReels ? 400 : 900;
    const tags = (s.hashtags || []).join(" ");
    const full = s.caption + (tags ? "\n\n" + tags : "");
    let h = '<section class="block"><div class="block-h"><h3>Подпись</h3><span class="count ' + (len < lo || len > hi ? "warn" : "") + '">' + len + " / " + lo + "–" + hi + "</span></div>"
      + "<textarea" + bindAttr(b + "caption") + ">" + esc(s.caption) + "</textarea>"
      + '<div class="row">' + '<button class="btn primary sm" data-act="copyCaptionAll" data-id="' + esc(id) + '">' + icon("copy") + "С хэштегами</button>" + copyBtn(s.caption, "Только подпись") + "</div>"
      + refineBar("caption", s, "caption") + "</section>"
      + '<section class="block"><div class="block-h"><h3>Хэштеги</h3><span class="count ' + ((s.hashtags || []).length > 10 ? "warn" : "") + '">' + (s.hashtags || []).length + " / 5–10</span></div>"
      + '<textarea rows="2" data-kind="tags"' + bindAttr(b + "hashtags") + ">" + esc(tags) + '</textarea><div class="row">' + copyBtn(tags) + "</div></section>"
      + '<section class="block"><h3>Alt-текст</h3><p class="hint">Instagram: «Расширенные настройки → Специальные возможности». Помогает поиску.</p>'
      + '<textarea rows="2"' + bindAttr(b + "altText") + ">" + esc(s.altText) + '</textarea><div class="row">' + copyBtn(s.altText) + "</div></section>"
      + '<section class="block"><h3>Первый комментарий</h3><p class="hint">Опубликуйте сразу после поста — запускает обсуждение.</p>'
      + '<textarea rows="2"' + bindAttr(b + "firstComment") + ">" + esc(s.firstComment) + '</textarea><div class="row">' + copyBtn(s.firstComment) + "</div></section>";
    if (s.goal === "sales" || s.codeWord || s.dmReply){
      h += '<section class="block"><h3>Кодовое слово</h3><p class="hint">Механика «напишите СЛОВО в комментариях — пришлю ссылку»: автоответ настраивается в ManyChat или аналоге.</p>'
        + '<input type="text" class="caps"' + bindAttr(b + "codeWord") + ' value="' + esc(s.codeWord) + '" placeholder="ХОЧУ">'
        + '<div class="field"><label>Автоответ в личку</label><textarea rows="2"' + bindAttr(b + "dmReply") + ">" + esc(s.dmReply) + '</textarea></div><div class="row">' + copyBtn(s.dmReply, "Копировать автоответ") + "</div></section>";
    }
    return h + '<div class="row center">' + btnBusy("gen:" + id + ":caption", icon("spark") + "Переписать весь текст заново", "gen", ' data-id="' + esc(id) + '" data-what="caption"', "sm ghost") + "</div>";
  }
  function paneExtra(s){
    const id = s.id, b = "slot:" + id + ":";
    let h = "";
    if (s.pillarType === "REELS"){
      h += '<section class="block"><div class="block-h"><h3>Сценарий Reels</h3>' + (s.trial ? '<span class="badge">пробный</span>' : "") + "</div>"
        + '<p class="hint">3 варианта крючка на первые 3 секунды, раскадровка по секундам, звук, обложка, что снять самому.' + (s.trial ? " Для пробного — 2–3 версии для теста." : "") + "</p>"
        + (s.reelsScript ? "<textarea" + bindAttr(b + "reelsScript") + ">" + esc(s.reelsScript) + '</textarea><div class="row">' + copyBtn(s.reelsScript) + "</div>" + refineBar("reels", s, "reelsScript")
          : btnBusy("gen:" + id + ":reels", icon("spark") + "Написать сценарий", "gen", ' data-id="' + esc(id) + '" data-what="reels"', "primary"))
        + "</section>";
      if (s.trial){
        h += '<section class="block"><h3>Итог теста</h3><p class="hint">Пробные Reels видят только неподписчики (доступно от 1000 подписчиков). Запишите, какая версия победила по досмотру и пересылкам.</p>'
          + "<textarea rows=\"3\"" + bindAttr(b + "testResult") + ' placeholder="Версия B (крючок-вопрос): досмотр 41% против 28%. Выпускаем в ленту.">' + esc(s.testResult) + "</textarea>"
          + '<div class="row"><button class="btn sm" data-act="testToInsight" data-id="' + esc(id) + '">В выводы аккаунта</button></div></section>';
      }
    }
    h += '<section class="block"><h3>Сторис к посту</h3><p class="hint">4–5 сторис: тизер, анонс, опрос или вопрос, продажа или польза.</p>'
      + (s.storiesPlan ? "<textarea" + bindAttr(b + "storiesPlan") + ">" + esc(s.storiesPlan) + '</textarea><div class="row">' + copyBtn(s.storiesPlan) + "</div>" + refineBar("stories", s, "storiesPlan")
        : btnBusy("gen:" + id + ":stories", icon("spark") + "Придумать сторис", "gen", ' data-id="' + esc(id) + '" data-what="stories"', s.pillarType === "REELS" ? "" : "primary"))
      + (promptText(s) ? '<div class="row"><button class="btn sm" data-act="copyStory" data-id="' + esc(id) + '">Промт картинки 9:16</button></div>' : "")
      + "</section>";
    return h;
  }
  const METRICS = [["reach", "Охват"], ["views", "Просмотры"], ["likes", "Лайки"], ["comments", "Комментарии"], ["saves", "Сохранения"], ["shares", "Пересылки"], ["profileVisits", "Переходы в профиль"], ["follows", "Подписки"]];
  function paneStats(s){
    const id = s.id, m = s.metrics || {}, r = P.rates(m);
    let h = '<section class="block"><h3>Публикация</h3><div class="row nowrap"><input type="date"' + bindAttr("slot:" + id + ":publishedAt") + ' value="' + esc(s.publishedAt) + '" data-rerender>'
      + '<button class="btn sm" data-act="publish" data-id="' + esc(id) + '">Сегодня</button></div>'
      + (s.publishedAt ? "" : '<p class="hint">Отметьте дату, когда пост вышел, — он перейдёт в «Опубликованы».</p>') + "</section>";
    h += '<section class="block"><div class="block-h"><h3>Статистика поста</h3>'
      + '<label class="btn sm' + (busy("metrics:" + id) ? " disabled" : "") + '">' + (busy("metrics:" + id) ? '<span class="spin"></span>' + esc(busy("metrics:" + id)) : icon("spark") + "Со скриншота") + '<input type="file" accept="image/*" hidden data-upload="metrics" data-id="' + esc(id) + '"></label></div>'
      + '<p class="hint">Instagram → пост → «Статистика». Сделайте скриншот и загрузите — числа заполнятся сами. Или введите вручную через 1–3 дня после публикации.</p>'
      + '<div class="metrics">' + METRICS.map(([k, l]) => '<label class="metric"><span>' + l + '</span><input type="number" inputmode="numeric" min="0"' + bindAttr("slot:" + id + ":metrics." + k) + ' value="' + esc(m[k] == null ? "" : m[k]) + '" data-rerender></label>').join("")
      + (s.pillarType === "REELS" ? '<label class="metric"><span>Досмотр / ср. время</span><input type="text"' + bindAttr("slot:" + id + ":metrics.watch") + ' value="' + esc(m.watch || "") + '"></label>' : "") + "</div>"
      + (r ? '<div class="kpis">' + kpi(r.savesPct + "%", "сохранения") + kpi(r.sharesPct + "%", "пересылки") + kpi(r.er + "%", "вовлечённость") + "</div>" : "")
      + "</section>";
    return h;
  }
  const kpi = (v, l) => '<div class="kpi"><b>' + esc(v) + "</b><span>" + esc(l) + "</span></div>";

  function postMenu(s){
    const i = S.slots.indexOf(s);
    return '<div class="sheet-list">'
      + (i > 0 ? '<button data-act="move" data-id="' + esc(s.id) + '" data-v="-1">↑ Раньше (поменять с №' + S.slots[i - 1].num + ")</button>" : "")
      + (i < S.slots.length - 1 ? '<button data-act="move" data-id="' + esc(s.id) + '" data-v="1">↓ Позже (поменять с №' + S.slots[i + 1].num + ")</button>" : "")
      + '<button data-act="duplicate" data-id="' + esc(s.id) + '">Дублировать пост</button>'
      + (productOf(s) ? '<button data-act="copyMaster" data-pid="' + esc(s.productId) + '">Промт мастер-кадра товара</button>' : "")
      + '<button data-act="rebuildAll" data-id="' + esc(s.id) + '">' + icon("spark") + "Пересоздать промт и текст заново</button>"
      + '<button class="danger" data-act="deletePost" data-id="' + esc(s.id) + '">' + icon("trash") + "Удалить пост</button>"
      + '<button data-act="closeSheet">Отмена</button></div>';
  }

  // ---------------------------------------------------------------- Новый план
  function viewPlanNew(kind){
    if (!S.ui.wiz){
      const perWeek = clamp(num(S.brand.postsPerWeek) || 5, 1, 14);
      S.ui.wiz = {count: kind === "week" ? perWeek : 9, perWeek, start: nextSchedule().date, times: times().join(", "), ai: hasKey(), createAll: false};
    }
    const w = S.ui.wiz, b = "ui:wiz:";
    return topbar(kind === "week" ? "План на неделю" : "Новый план", {back: true})
      + '<section class="card form">'
      + '<div class="grid2"><div class="field"><label>Сколько постов</label><input type="number" inputmode="numeric" min="1" max="30"' + bindAttr(b + "count") + ' value="' + esc(w.count) + '"></div>'
      + '<div class="field"><label>Постов в неделю</label><input type="number" inputmode="numeric" min="1" max="14"' + bindAttr(b + "perWeek") + ' value="' + esc(w.perWeek) + '"></div>'
      + '<div class="field"><label>С какой даты</label><input type="date"' + bindAttr(b + "start") + ' value="' + esc(w.start) + '"></div>'
      + '<div class="field"><label>Время публикаций</label><input type="text"' + bindAttr(b + "times") + ' value="' + esc(w.times) + '" placeholder="12:30, 19:00"></div></div>'
      + '<label class="check"><input type="checkbox"' + (w.ai ? " checked" : "") + bindAttr(b + "ai") + (hasKey() ? "" : " disabled") + "><span>Идеи постов от ИИ" + (hasKey() ? "" : " <small>— нужен ключ Claude</small>") + "</span></label>"
      + '<label class="check"><input type="checkbox"' + (w.createAll ? " checked" : "") + bindAttr(b + "createAll") + (hasKey() ? "" : " disabled") + "><span>Сразу создать промты и тексты для всех постов <small>— дольше, расходует баланс Claude</small></span></label>"
      + '<div class="how"><b>Что сделает приложение:</b><ul><li>расставит типы по ритму — два плотных поста (Hero, Карусель) не встанут подряд, Reels чаще;</li><li>распределит рубрики по долям из «Бренда» и поставит цель каждому посту;</li><li>подставит товары по очереди и поводы из календаря;</li><li>добавит посты в конец плана — номера старых не изменятся.</li></ul></div>'
      + (S.ui.wizBusy ? '<button class="btn primary wide" disabled><span class="spin"></span>' + esc(S.ui.wizBusy) + "</button>" : '<button class="btn primary wide" data-act="generatePlan">' + icon("spark") + "Создать план</button>")
      + "</section>";
  }

  // ---------------------------------------------------------------- Идеи
  function subTabs(base, cur, list){
    return '<nav class="tabs sticky" role="tablist">' + list.map(([k, l]) => '<a role="tab" class="' + (cur === k ? "on" : "") + '" href="#/' + base + "/" + k + '">' + l + "</a>").join("") + "</nav>";
  }
  function viewIdeas(tab){
    let h = topbar("Идеи") + subTabs("ideas", tab, [["bank", "Банк идей"], ["events", "Поводы"], ["rivals", "Конкуренты"]]);
    if (tab === "events") return h + ideasEvents();
    if (tab === "rivals") return h + ideasRivals();
    const rub = S.ui.ideaRubric || "";
    h += '<section class="card"><div class="row nowrap"><select data-bind="ui:ideaRubric">' + opt("", "Все рубрики", rub) + rubricsOf().map(r => opt(r.name, r.name, rub)).join("") + "</select>"
      + btnBusy("ideas", icon("spark") + "10 идей", "genIdeas", "", "primary") + "</div>"
      + '<div class="row nowrap mt"><input type="text" placeholder="Своя идея…" data-focus-key="ideaNew" id="ideaNew"><button class="btn" data-act="addIdea">Добавить</button></div></section>';
    if (!S.ideas.length) return h + '<p class="muted center pad">Банк пуст. Попросите ИИ придумать идеи или добавьте свою — потом одним нажатием отправите её в план.</p>';
    return h + '<div class="cards">' + S.ideas.map(it => '<article class="card idea"><p>' + esc(it.text) + "</p>"
      + '<div class="meta">' + [it.type ? P.pillarOf(it.type).label : "", it.rubric, P.goalLabel(it.goal)].filter(Boolean).map(x => '<span class="badge">' + esc(x) + "</span>").join("") + "</div>"
      + (it.why ? '<p class="hint">' + esc(it.why) + "</p>" : "")
      + '<div class="row"><button class="btn primary sm" data-act="ideaToPlan" data-id="' + esc(it.id) + '">В план</button><button class="btn sm ghost" data-act="delIdea" data-id="' + esc(it.id) + '">' + icon("trash") + "</button></div></article>").join("") + "</div>";
  }
  function ideasEvents(){
    const t = todayIso();
    const evs = P.upcomingEvents(t, 100, customEvents());
    let h = '<p class="hint pad">Готовьте контент заранее: подборки и подарки — за 2–3 недели, сторис-напоминания — за 3–5 дней. Свои поводы добавьте в Профиль → Бренд. Сейчас: ' + esc(P.seasonHint(new Date().getMonth())) + ".</p>";
    if (!evs.length) return h + '<p class="muted center pad">В ближайшие 100 дней поводов нет.</p>';
    return h + '<div class="cards">' + evs.map(e => {
      const from = addDays(e.date, -(e.lead || 14));
      const planned = S.slots.some(s => s.event && s.event.indexOf(e.title) === 0);
      return '<article class="card event-card"><div class="row between"><b>' + esc(e.title) + '</b><span class="muted">' + esc(fmtDate(e.date, true)) + "</span></div>"
        + (e.idea ? "<p>" + esc(e.idea) + "</p>" : "") + '<p class="hint">Готовить с ' + esc(fmtDate(from)) + (from <= t ? " — уже пора" : "") + "</p>"
        + '<div class="row"><button class="btn sm ' + (planned ? "" : "primary") + '" data-act="eventPost" data-date="' + esc(e.date) + '" data-lead="' + (e.lead || 14) + '" data-title="' + esc(e.title) + '" data-idea="' + esc(e.idea || "") + '">' + (planned ? "Ещё пост к поводу" : "Пост к поводу") + "</button></div></article>";
    }).join("") + "</div>";
  }
  function ideasRivals(){
    const res = S.ui.results.rival;
    let h = '<section class="card"><p class="hint">Загрузите скриншот ленты или поста другого бренда — ИИ разберёт, что у них работает, какие приёмы можно адаптировать под вашу ДНК и чего у них нет. Вдохновляемся приёмом, а не копируем.</p>'
      + '<div class="field"><label>Бренд (необязательно)</label><input type="text" data-bind="ui:rivalName" value="' + esc(S.ui.rivalName || "") + '" placeholder="@account"></div>'
      + '<label class="btn primary' + (busy("rival") ? " disabled" : "") + '">' + (busy("rival") ? '<span class="spin"></span>' + esc(busy("rival")) : icon("upload") + "Скриншот → разбор") + '<input type="file" accept="image/*" hidden data-upload="rival"></label></section>';
    if (res) h += rivalResult(res, true);
    if (S.competitors.length){
      h += '<h2 class="sec-h">Прошлые разборы</h2>' + S.competitors.slice(0, 10).map(c => '<details class="card"><summary><b>' + esc(c.name || "Без названия") + '</b> <span class="muted">' + esc(fmtDate(c.date)) + "</span></summary>" + rivalResult(c.result, false) + "</details>").join("");
    }
    return h;
  }
  function rivalResult(r, withIdeas){
    const lst = (t, a) => (a && a.length ? "<h3>" + t + "</h3><ul>" + a.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>" : "");
    return '<section class="card ai-card">' + lst("Что работает", r.works) + lst("Приёмы для нас", r.techniques) + lst("Подписи и призывы", r.captions) + lst("Чего у них нет", r.gaps)
      + (withIdeas && (r.ideas || []).length ? "<h3>Идеи для нас</h3>" + r.ideas.map((it, i) => '<div class="idea-mini"><p>' + esc(it.text) + '</p><button class="btn sm" data-act="rivalIdea" data-i="' + i + '">В банк</button></div>').join("") : "")
      + "</section>";
  }

  // ---------------------------------------------------------------- Рост
  function viewGrowth(tab){
    let h = topbar("Рост") + subTabs("growth", tab, [["stats", "Статистика"], ["check", "Проверка"], ["tests", "Тесты"], ["collabs", "Коллабы"]]);
    if (tab === "check") return h + growthCheck();
    if (tab === "tests") return h + growthTests();
    if (tab === "collabs") return h + growthCollabs();
    return h + growthStats();
  }
  function growthStats(){
    const rows = statRows();
    let h = "";
    if (!rows.length){
      h += '<section class="empty"><div class="empty-ic">' + icon("growth") + '</div><h2>Пока нет цифр</h2><p>Откройте опубликованный пост → «Итоги» и загрузите скриншот его статистики. Когда наберётся несколько постов, здесь появятся топы, лучшее время и выводы ИИ.</p></section>';
    } else {
      const top = rows.slice().sort((a, b) => P.score(b.s.metrics) - P.score(a.s.metrics));
      h += '<div class="kpis big">' + kpi(rows.length, "постов с цифрами") + kpi(avg(rows, r => r.savesPct) + "%", "ср. сохранения") + kpi(avg(rows, r => r.sharesPct) + "%", "ср. пересылки") + kpi(avg(rows, r => r.er) + "%", "ср. вовлечённость") + "</div>";
      const lineRow = r => '<a class="mrow" href="#/post/' + esc(r.s.id) + '">' + thumbMini(r.s) + "<span><b>№" + r.s.num + " · " + esc(P.pillarOf(r.s.pillarType).label) + "</b><small>" + esc(P.clip(r.s.note, 60)) + '</small></span><span class="nums">' + r.savesPct + "% · " + r.sharesPct + "%</span></a>";
      h += '<section class="card"><h3>Лучшие по сохранениям и пересылкам</h3>' + top.slice(0, 3).map(lineRow).join("") + "</section>";
      if (rows.length > 3) h += '<section class="card"><h3>Слабее всего</h3>' + top.slice(-3).reverse().map(lineRow).join("") + "</section>";
      const table = (title, g) => '<section class="card"><h3>' + title + '</h3><table class="tbl"><thead><tr><th></th><th>постов</th><th>%сохр.</th><th>%перес.</th><th>ER</th></tr></thead><tbody>'
        + g.map(x => "<tr><td>" + esc(x.k) + "</td><td>" + x.n + "</td><td>" + x.saves + "</td><td>" + x.shares + "</td><td>" + x.er + "</td></tr>").join("") + "</tbody></table></section>";
      h += table("По типу", groupAvg(rows, s => P.pillarOf(s.pillarType).label)) + table("По рубрике", groupAvg(rows, s => s.rubric)) + table("По цели", groupAvg(rows, s => P.goalLabel(s.goal)));
      if (rows.length >= 6){
        h += table("По дню недели", groupAvg(rows.filter(r => r.s.publishedAt || r.s.date), s => WEEKDAYS[new Date((s.publishedAt || s.date) + "T12:00:00").getDay()]))
          + table("По времени", groupAvg(rows.filter(r => r.s.time), s => s.time.slice(0, 2) + ":00"));
      } else h += '<p class="hint pad">Лучшие день и время появятся, когда цифры будут у 6+ постов.</p>';
    }
    const ins = S.insights;
    h += '<section class="card"><div class="block-h"><h3>Выводы аккаунта</h3></div><p class="hint">ИИ учитывает эти выводы при планировании, идеях и текстах.</p>'
      + (ins.items.length ? '<ul class="insights">' + ins.items.map(x => "<li><span>" + esc(x.text) + '</span><small class="muted">' + esc(fmtDate(x.date)) + '</small><button class="icon-btn sm" data-act="delInsight" data-id="' + esc(x.id) + '" aria-label="Удалить">' + icon("x") + "</button></li>").join("") + "</ul>" : '<p class="muted">Пока пусто.</p>')
      + '<div class="row nowrap mt"><input type="text" id="insightNew" data-focus-key="insightNew" placeholder="Свой вывод, напр. «Reels с руками досматривают лучше»"><button class="btn" data-act="addInsight">Добавить</button></div>'
      + '<div class="row mt">' + btnBusy("insights", icon("spark") + "Выводы и советы", "genInsights", "", rows.length ? "primary wide" : "wide") + "</div>"
      + '<div class="row nowrap"><select data-bind="ui:reportMonth">' + monthOpts() + "</select>" + btnBusy("report", icon("spark") + "Отчёт за месяц", "genReport", "", "") + "</div>"
      + (ins.summary ? '<div class="ai-out"><div class="ai-text">' + esc(ins.summary) + "</div></div>" : "")
      + (ins.advice && ins.advice.length ? "<h3>Советы</h3><ol>" + ins.advice.map(a => "<li>" + esc(a) + "</li>").join("") + "</ol>" : "")
      + (ins.report ? "<h3>Отчёт" + (ins.reportMonth ? " · " + esc(ins.reportMonth) : "") + "</h3>" + aiOut("report", ins.report) : "")
      + "</section>";
    h += '<section class="card"><h3>Подписчики по месяцам</h3>'
      + (S.followers.length ? '<table class="tbl"><tbody>' + S.followers.slice().sort((a, b) => b.month.localeCompare(a.month)).map(f => "<tr><td>" + esc(f.month) + "</td><td>" + esc(f.count) + '</td><td><button class="icon-btn sm" data-act="delFollowers" data-m="' + esc(f.month) + '" aria-label="Удалить">' + icon("x") + "</button></td></tr>").join("") + "</tbody></table>" : "")
      + '<div class="row nowrap mt"><input type="month" id="folMonth" value="' + todayIso().slice(0, 7) + '"><input type="number" inputmode="numeric" id="folCount" placeholder="число"><button class="btn" data-act="addFollowers">Добавить</button></div></section>';
    return h;
  }
  function monthOpts(){
    const cur = S.ui.reportMonth || todayIso().slice(0, 7);
    const out = [];
    const d = new Date(); d.setDate(1);
    for (let i = 0; i < 12; i++){ const v = d.getFullYear() + "-" + pad(d.getMonth() + 1); out.push(opt(v, v, cur)); d.setMonth(d.getMonth() - 1); }
    return out.join("");
  }
  function growthCheck(){
    const R = S.ui.results;
    const nums = S.slots.map(s => s.num);
    if (S.ui.rangeFrom == null) S.ui.rangeFrom = nums.length ? Math.min(...nums.slice(-9)) : 1;
    if (S.ui.rangeTo == null) S.ui.rangeTo = nums.length ? Math.max(...nums.slice(-9)) : 1;
    const from = S.ui.rangeFrom, to = S.ui.rangeTo;
    return '<section class="card"><h3>Проверка плана</h3><p class="hint">Ритм, баланс рубрик и целей, форматы, повторы и пропущенные поводы — с конкретной правкой для каждого проблемного поста.</p>'
      + '<div class="row"><label class="inline">с №<input type="number" class="short" inputmode="numeric" data-bind="ui:rangeFrom" value="' + esc(from) + '"></label><label class="inline">по №<input type="number" class="short" inputmode="numeric" data-bind="ui:rangeTo" value="' + esc(to) + '"></label></div>'
      + btnBusy("review", icon("spark") + "Проверить план", "genReview", "", "primary wide") + aiOut("review", R.review) + "</section>"
      + '<section class="card"><h3>Сетка профиля</h3><p class="hint">Как ближайшие 9 постов лягут в сетку 3 × 3: чередование светлых и тёмных, крупных и общих планов. Вид сетки — в Ленте.</p>'
      + btnBusy("grid", icon("spark") + "Разобрать сетку", "genGrid", "", "") + aiOut("grid", R.grid) + "</section>"
      + '<section class="card"><h3>Лента по скриншоту</h3><p class="hint">Скриншот вашего профиля — оценка цельности ленты и что поставить следующим.</p>'
      + uploadBtn("feedShot", "Загрузить скриншот ленты") + aiOut("feedShot", R.feedShot) + "</section>"
      + '<section class="card"><h3>Аудит профиля</h3><p class="hint">Скриншот шапки профиля — проверка имени (ключевое слово ниши), описания, ссылки, закрепов и хайлайтов с готовыми текстами.</p>'
      + uploadBtn("audit", "Загрузить скриншот шапки") + aiOut("audit", R.audit) + "</section>";
  }
  function uploadBtn(kind, label){
    const b = busy(kind);
    return '<label class="btn' + (b ? " disabled" : "") + '">' + (b ? '<span class="spin"></span>' + esc(b) : icon("upload") + esc(label)) + '<input type="file" accept="image/*" hidden data-upload="' + kind + '"></label>';
  }
  function growthTests(){
    const tests = S.slots.filter(s => s.pillarType === "REELS" && s.trial);
    let h = '<p class="hint pad">Пробные Reels показываются только неподписчикам и не появляются в профиле (доступно от 1000 подписчиков). Меняйте одну вещь — крючок, первый кадр или длину — и сравнивайте досмотр и пересылки.</p>'
      + '<div class="row pad"><button class="btn primary" data-act="newTest">' + icon("film") + "Новый пробный Reels</button></div>";
    if (!tests.length) return h + '<p class="muted center pad">Пробных Reels пока нет.</p>';
    return h + '<div class="plist">' + tests.map(s => row(s) + (s.testResult ? '<p class="test-res">' + esc(s.testResult) + "</p>" : "")).join("") + "</div>";
  }
  function growthCollabs(){
    const R = S.ui.results;
    const st = ["идея", "написали", "ответили", "договорились", "вышло", "отказ"];
    let h = '<section class="card"><h3>Микроблогеры 10–100 тыс.</h3><p class="hint">У микроблогеров выше доверие и вовлечённость, а сотрудничество дешевле. Collab-пост выходит сразу в двух профилях.</p>'
      + '<div class="grid2"><input type="text" id="colHandle" placeholder="@ник"><input type="text" id="colFollowers" placeholder="подписчиков"><input type="text" id="colNiche" placeholder="ниша, стиль"><button class="btn" data-act="addCollab">Добавить</button></div></section>';
    if (S.collabs.length){
      h += '<div class="cards">' + S.collabs.map(c => '<article class="card"><div class="row between"><b>' + esc(c.handle) + '</b><button class="icon-btn sm" data-act="delCollab" data-id="' + esc(c.id) + '" aria-label="Удалить">' + icon("x") + "</button></div>"
        + '<p class="muted">' + [c.followers, c.niche].filter(Boolean).map(esc).join(" · ") + "</p>"
        + '<div class="row nowrap"><select data-bind="collab:' + esc(c.id) + ':status">' + st.map(x => opt(x, x, c.status || "идея")).join("") + "</select>"
        + btnBusy("collab:message:" + c.id, icon("spark") + "Сообщение", "genCollab", ' data-kind="message" data-id="' + esc(c.id) + '"', "sm") + "</div>"
        + aiOut("c" + c.id, R["collab:message:" + c.id]) + "</article>").join("") + "</div>";
    }
    h += '<section class="card"><h3>Шаблоны</h3><div class="row">'
      + btnBusy("collab:find", icon("spark") + "Как искать блогеров", "genCollab", ' data-kind="find"', "sm")
      + btnBusy("collab:brief", icon("spark") + "Бриф Collab", "genCollab", ' data-kind="brief"', "sm")
      + btnBusy("collab:review", icon("spark") + "Просьба об отзыве", "genCollab", ' data-kind="review"', "sm") + "</div>"
      + aiOut("cf", R["collab:find"]) + aiOut("cb", R["collab:brief"]) + aiOut("cr", R["collab:review"]) + "</section>";
    return h;
  }

  // ---------------------------------------------------------------- Профиль
  function viewProfile(sec, arg){
    if (sec === "brand") return profileBrand();
    if (sec === "products") return profileProducts();
    if (sec === "product") return profileProduct(arg);
    if (sec === "connect") return profileConnect();
    if (sec === "lists") return profileLists();
    if (sec === "backup") return profileBackup();
    if (sec === "help") return profileHelp();
    const pub = S.slots.filter(s => s.publishedAt).length;
    const initial = (String(S.brand.name || "").trim()[0] || "А").toUpperCase();
    const theme = lsGet("atelier.theme", "");
    const item = (href, ic, title, sub, warn) => '<a class="menu-item" href="#/profile/' + href + '">' + icon(ic) + "<span><b>" + title + "</b><small>" + sub + "</small></span>" + (warn ? '<i class="dot-warn"></i>' : "") + icon("chevron", "go") + "</a>";
    return topbar("Профиль")
      + '<section class="card profile-card"><div class="avatar">' + esc(initial) + '</div><div><h2>' + esc(S.brand.name || "Ваш бренд") + '</h2><p class="muted">' + esc(S.brand.handle || S.brand.niche || "заполните раздел «Бренд»") + "</p>"
      + '<div class="pstats"><span><b>' + S.slots.length + "</b> постов</span><span><b>" + pub + "</b> опубл.</span><span><b>" + S.products.length + "</b> товаров</span></div></div></section>"
      + '<nav class="menu">'
      + item("brand", "user", "Бренд", "голос, аудитория, рубрики, ключевые слова, хэштеги", !S.brand.name)
      + item("products", "image", "Товары", S.products.length ? S.products.length + " в каталоге" : "добавьте первый товар", !S.products.length)
      + item("connect", "spark", "Подключение", hasKey() ? "ключ Claude добавлен" + (A.cloud() ? " · Supabase" : " · данные на устройстве") : "добавьте ключ Claude", !hasKey())
      + item("lists", "list", "Списки сцен", "локации, свет, ракурсы, реквизит")
      + item("backup", "upload", "Резервная копия", "скачать или загрузить все данные")
      + item("help", "ideas", "Как пользоваться", "5 шагов от идеи до статистики")
      + "</nav>"
      + '<section class="card"><h3>Тема</h3><div class="seg wide">' + [["", "Авто"], ["light", "Светлая"], ["dark", "Тёмная"]].map(([v, l]) => '<button class="' + (theme === v ? "on" : "") + '" data-act="theme" data-v="' + v + '">' + l + "</button>").join("") + "</div></section>"
      + '<p class="hint center">web 2026-09-25 · 2.0</p>';
  }
  function fld(label, path, val, o){
    o = o || {};
    const input = o.area
      ? "<textarea rows=\"" + (o.rows || 2) + "\"" + bindAttr(path) + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : "") + ">" + esc(val || "") + "</textarea>"
      : '<input type="' + (o.type || "text") + '"' + (o.type === "number" ? ' inputmode="decimal"' : "") + bindAttr(path) + ' value="' + esc(val == null ? "" : val) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : "") + ">";
    return '<div class="field' + (o.full ? " full" : "") + '"><label>' + label + "</label>" + input + (o.hint ? '<p class="hint">' + o.hint + "</p>" : "") + "</div>";
  }
  function profileBrand(){
    const b = S.brand, p = "brand:";
    const ex = b.examples || [];
    const rub = rubricsOf();
    const sum = rub.reduce((a, r) => a + num(r.share), 0);
    return topbar("Бренд", {back: "profile"})
      + '<p class="hint pad">Всё, что здесь, ИИ учитывает в каждом промте и тексте. Сохраняется само.</p>'
      + '<section class="card form"><h3>О бренде</h3><div class="grid2">'
      + fld("Название", p + "name", b.name, {ph: "Ателье"}) + fld("Аккаунт", p + "handle", b.handle, {ph: "@atelier.home"})
      + fld("Что продаём", p + "niche", b.niche, {ph: "декор для дома: текстиль, керамика, свет"}) + fld("Город / доставка", p + "city", b.city)
      + fld("Для кого", p + "audience", b.audience, {area: true, full: true, ph: "Женщины 25–45, снимают или купили первую квартиру, любят тёплые интерьеры"})
      + fld("Чем отличаемся", p + "usp", b.usp, {area: true, full: true})
      + fld("Ссылка в профиле ведёт на", p + "link", b.link, {full: true}) + "</div></section>"
      + '<section class="card form"><h3>Голос</h3><div class="grid2">'
      + '<div class="field"><label>Обращение</label><select' + bindAttr(p + "address") + ">" + opt("вы", "на «вы»", b.address || "вы") + opt("ты", "на «ты»", b.address || "вы") + "</select></div>"
      + fld("Любимые эмодзи", p + "emojis", b.emojis, {ph: "🤍 🕯"})
      + fld("Нельзя (слова и приёмы)", p + "banned", b.banned, {area: true, full: true, ph: "«уникальный», «лучший», «шок», «успей купить», капслок, давление срочностью"}) + "</div>"
      + "<h3>Удачные подписи — примеры для ИИ</h3><p class=\"hint\">Вставьте 3–5 своих лучших подписей: так ИИ точнее попадёт в ваш тон.</p>"
      + [0, 1, 2, 3, 4].map(i => "<textarea rows=\"2\"" + bindAttr(p + "examples." + i) + ' placeholder="Пример ' + (i + 1) + '">' + esc(ex[i] || "") + "</textarea>").join("") + "</section>"
      + '<section class="card form"><h3>Рубрики и доли</h3><p class="hint">Автоплан распределяет посты по этим долям' + (sum !== 100 ? ' · <b class="warn-t">сейчас сумма ' + sum + "%</b>" : "") + ".</p>"
      + '<div class="rubrics">' + rub.map((r, i) => '<div class="rubric-row"><input type="text"' + bindAttr(p + "rubrics." + i + ".name") + ' value="' + esc(r.name) + '"><input type="number" class="short" inputmode="numeric"' + bindAttr(p + "rubrics." + i + ".share") + ' value="' + esc(r.share) + '"><span>%</span>'
        + "<select" + bindAttr(p + "rubrics." + i + ".goal") + ">" + P.GOAL_KEYS.map(g => opt(g, P.GOALS[g].label, r.goal)).join("") + "</select>"
        + '<button class="icon-btn sm" data-act="delRubric" data-i="' + i + '" aria-label="Удалить">' + icon("x") + "</button></div>").join("") + "</div>"
      + '<button class="btn sm" data-act="addRubric">＋ Рубрика</button></section>'
      + '<section class="card form"><h3>Поиск и хэштеги</h3>'
      + fld("Ключевые слова — как ищут покупатели", p + "keywords", b.keywords, {area: true, rows: 3, ph: "декор для дома, ваза для сухоцветов, идеи для гостиной, уютная спальня"})
      + fld("Банк хэштегов", p + "hashtags", b.hashtags, {area: true, rows: 3, ph: "широкие: #ДекорДляДома #Уют · нишевые: #ВазаДляСухоцветов · фирменные: #АтельеДома"})
      + '<div class="grid2">' + fld("Кодовое слово по умолчанию", p + "codeWord", b.codeWord, {ph: "ХОЧУ"}) + "</div></section>"
      + '<section class="card form"><h3>Ритм и поводы</h3><div class="grid2">'
      + fld("Постов в неделю", p + "postsPerWeek", b.postsPerWeek || 5, {type: "number"}) + fld("Время публикаций", p + "times", b.times || "12:30, 19:00")
      + fld("Свои поводы", p + "events", b.events, {area: true, full: true, rows: 3, ph: "05-10 День рождения бренда — розыгрыш\n2026-11-20 Поставка новой коллекции", hint: "По строке: дата (ММ-ДД, ДД.ММ или ГГГГ-ММ-ДД), название, после « — » идея."})
      + fld("Какие референсы стиля прикладывать в ChatGPT", p + "refNote", b.refNote, {area: true, full: true, ph: "карточки №3 и №7 из профиля — они задают свет и палитру"})
      + "</div></section>";
  }
  function profileProducts(){
    let h = topbar("Товары", {back: "profile"}) + '<div class="row pad"><button class="btn primary" data-act="newProduct">＋ Новый товар</button></div>';
    if (!S.products.length) return h + '<p class="muted center pad">Добавьте товар: название, размеры и преимущества попадут в промты и подписи — ИИ ничего не будет выдумывать.</p>';
    return h + '<nav class="menu">' + S.products.map(p => '<a class="menu-item" href="#/profile/product/' + esc(p.id) + '">' + icon("image") + "<span><b>" + esc(p.name || "Без названия") + "</b><small>"
      + esc([p.category, [p.height, p.width, p.depth].filter(Boolean).join("×") ? [p.height, p.width, p.depth].join("×") + " см" : "", p.masterShot ? "мастер-кадр ✓" : ""].filter(Boolean).join(" · ") || "заполните данные")
      + "</small></span>" + icon("chevron", "go") + "</a>").join("") + "</nav>";
  }
  function profileProduct(id){
    const p = productById(id);
    if (!p) return topbar("Товар", {back: "profile/products"}) + '<p class="pad muted">Товар не найден.</p>';
    const b = "product:" + id + ":";
    const ben = p.benefits || [];
    return topbar(esc(p.name || "Новый товар"), {back: "profile/products"})
      + '<section class="card form"><div class="grid2">'
      + fld("Название", b + "name", p.name, {ph: "Ваза «Дюна»"}) + fld("Категория", b + "category", p.category, {ph: "керамическая ваза"})
      + fld("Цена", b + "price", p.price) + fld("Ссылка", b + "link", p.link)
      + fld("Материал / фактура", b + "material", p.material) + fld("Цвет (точный оттенок)", b + "color", p.color)
      + fld("Высота, см", b + "height", p.height, {type: "number"}) + fld("Ширина, см", b + "width", p.width, {type: "number"})
      + fld("Глубина, см", b + "depth", p.depth, {type: "number"}) + fld("Акцентный цвет карточек", b + "accent", p.accent, {ph: "терракотовый"})
      + "</div><h3>Преимущества</h3><p class=\"hint\">Только подтверждаемые. Без «ручная работа» и «натуральный материал», если это не так.</p>"
      + [0, 1, 2].map(i => '<input type="text"' + bindAttr(b + "benefits." + i) + ' value="' + esc(ben[i] || "") + '" placeholder="Преимущество ' + (i + 1) + '">').join("")
      + '<div class="grid2">' + fld("Как этот товар ищут", b + "keywords", p.keywords, {full: true, ph: "ваза для сухоцветов, высокая ваза в гостиную"})
      + fld("Для какой комнаты", b + "room", p.room) + fld("Уход", b + "care", p.care)
      + fld("Что ИИ часто искажает", b + "distortions", p.distortions, {full: true, ph: "рельеф горлышка, матовая глазурь не должна блестеть"}) + "</div>"
      + '<label class="check"><input type="checkbox"' + (p.masterShot ? " checked" : "") + bindAttr(b + "masterShot") + "><span>Мастер-кадр готов <small>— прикладываю его вместо фото товара</small></span></label></section>"
      + '<section class="card"><h3>Мастер-кадр</h3><p class="hint">Сначала сделайте в ChatGPT один точный эталонный кадр по 3–4 фото товара (спереди, сбоку, деталь, в масштабе) — дальше прикладывайте его ко всем карточкам, так ИИ меньше искажает товар.</p>'
      + '<div class="row"><button class="btn primary sm" data-act="copyMaster" data-pid="' + esc(id) + '">' + icon("copy") + 'Промт мастер-кадра</button><a class="btn sm" href="https://chatgpt.com/" target="_blank" rel="noopener">' + icon("ext") + "ChatGPT</a></div></section>"
      + '<div class="row center pad"><button class="btn ghost danger" data-act="delProduct" data-id="' + esc(id) + '">' + icon("trash") + "Удалить товар</button></div>";
  }
  function profileConnect(){
    const c = cfg();
    const models = [["claude-sonnet-5", "Sonnet 5"], ["claude-opus-5-5", "Opus 5.5"], ["claude-haiku-4-5-20251001", "Haiku 4.5"]];
    const mopts = cur => models.concat(models.find(m => m[0] === cur) ? [] : [[cur, cur]]).map(([v, l]) => opt(v, l, cur)).join("");
    return topbar("Подключение", {back: "profile"})
      + '<section class="card form"><h3>ИИ — Claude</h3><p class="hint">Ключ хранится только в этом браузере и отправляется только в Anthropic. Получить: console.anthropic.com → API Keys.</p>'
      + '<div class="field"><label>API-ключ</label><input type="password" id="cfgAnthKey" autocomplete="off" value="' + esc(c.anthropicKey) + '" placeholder="sk-ant-…"></div>'
      + '<div class="grid2"><div class="field"><label>Основная модель</label><select id="cfgModelDefault">' + mopts(c.modelDefault) + '</select></div><div class="field"><label>Быстрые задачи</label><select id="cfgModelQuick">' + mopts(c.modelQuick) + "</select></div></div>"
      + '<div class="row"><button class="btn sm" data-act="testAnth">Проверить ключ</button><span class="hint" id="anthStatus"></span></div></section>'
      + '<section class="card form"><h3>Данные — Supabase <small class="muted">(необязательно)</small></h3><p class="hint">Без Supabase всё хранится в этом браузере. С ним — план доступен с телефона и компьютера. Таблица kv — см. SETUP.md.</p>'
      + '<div class="field"><label>Project URL</label><input type="text" id="cfgSupaUrl" autocomplete="off" spellcheck="false" value="' + esc(c.supaUrl) + '" placeholder="https://xxxx.supabase.co"></div>'
      + '<div class="field"><label>Ключ anon public</label><input type="password" id="cfgSupaKey" autocomplete="off" value="' + esc(c.supaKey) + '"></div>'
      + '<div class="row"><button class="btn sm" data-act="testSupa">Проверить</button><span class="hint" id="supaStatus"></span></div></section>'
      + '<div class="row pad"><button class="btn primary wide" data-act="saveConn">Сохранить подключение</button></div>';
  }
  function profileLists(){
    const keys = [["locations", "Локации"], ["light", "Свет"], ["angles", "Ракурсы"], ["props", "Реквизит"], ["accentColors", "Акцентные цвета"]];
    return topbar("Списки сцен", {back: "profile"})
      + '<p class="hint pad">Базовые варианты фиксированы, свои добавляются поверх — они появятся в «Настроить сцену вручную».</p>'
      + keys.map(([k, l]) => '<section class="card"><h3>' + l + '</h3><div class="chips wrap">' + P.BASE[k].map(x => '<span class="chip static">' + esc(x) + "</span>").join("")
        + (S.custom[k] || []).map((x, i) => '<span class="chip on">' + esc(x) + '<button class="chip-x" data-act="delCustom" data-k="' + k + '" data-i="' + i + '" aria-label="Удалить">' + icon("x") + "</button></span>").join("") + "</div>"
        + '<div class="row nowrap mt"><input type="text" id="add-' + k + '" data-focus-key="add-' + k + '" placeholder="Добавить…"><button class="btn sm" data-act="addCustom" data-k="' + k + '">Добавить</button></div></section>').join("")
      + '<section class="card"><h3>Композиции Hero</h3>' + allList("compositions").map((c, i) => '<p><b>' + esc(c.label) + "</b> — " + esc(c.desc)
        + (i >= P.BASE.compositions.length ? ' <button class="link" data-act="delCustom" data-k="compositions" data-i="' + (i - P.BASE.compositions.length) + '">удалить</button>' : "") + "</p>").join("")
      + '<div class="field"><input type="text" id="compLabel" placeholder="Название, напр. G · Рамка"></div><div class="field"><textarea rows="2" id="compDesc" placeholder="Описание приёма"></textarea></div><button class="btn sm" data-act="addComposition">Добавить приём</button></section>';
  }
  function profileBackup(){
    return topbar("Резервная копия", {back: "profile"})
      + '<section class="card form"><h3>Скачать</h3><p class="hint">Один файл со всем: план, промты, тексты, бренд, товары, идеи, выводы.</p>'
      + '<label class="check"><input type="checkbox" id="expThumbs"><span>Включить превью картинок <small>— файл будет больше</small></span></label>'
      + '<button class="btn primary" data-act="export">' + icon("upload") + "Скачать копию</button></section>"
      + '<section class="card form"><h3>Загрузить</h3><p class="hint">Заменит текущие данные данными из файла (подходят и копии старой версии приложения).</p>'
      + '<input type="file" id="importFile" accept="application/json,.json"><button class="btn" data-act="import">Загрузить из файла</button></section>';
  }
  function profileHelp(){
    const st = [
      ["Профиль → Подключение", "Вставьте ключ Claude — без него приложение соберёт только шаблон промта."],
      ["Профиль → Бренд и Товары", "Тон, аудитория, ключевые слова, 3–5 примеров подписей; у товаров — размеры и преимущества. ИИ берёт факты только отсюда."],
      ["＋ → План на неделю", "Типы по ритму, рубрики по долям, цели, товары и поводы расставятся сами; ИИ придумает идеи."],
      ["Пост → «Создать промт и текст»", "Одна кнопка: промт с неповторяющейся сценой + подпись, хэштеги, alt-текст, первый комментарий (для Reels — сценарий). Любой блок дорабатывается кнопками-пожеланиями."],
      ["ChatGPT → картинка → обратно", "Копируйте промт, приложите фото товара (или мастер-кадр) и референс стиля. Готовую картинку загрузите в пост — ИИ проверит её перед публикацией."],
      ["Опубликовали → статистика", "Отметьте «Опубликован», через 1–3 дня загрузите скриншот статистики. В «Росте» появятся топы, лучшее время и выводы — ИИ учтёт их в следующем плане."]
    ];
    return topbar("Как пользоваться", {back: "profile"})
      + '<ol class="help">' + st.map(([t, d], i) => '<li><span class="n">' + (i + 1) + "</span><div><b>" + t + "</b><p>" + d + "</p></div></li>").join("") + "</ol>"
      + '<section class="card"><h3>Нижнее меню</h3><p><b>Лента</b> — план сеткой, как в профиле, и «Сегодня». <b>Идеи</b> — банк идей, поводы, конкуренты. <b>＋</b> — новый пост или план. <b>Рост</b> — статистика, проверки, тесты, коллабы. <b>Профиль</b> — бренд, товары, настройки.</p></section>'
      + '<section class="card"><h3>На что работаем</h3><p>Пересылки в директ и сохранения важнее лайков; в Reels решают первые 3 секунды; Instagram ищет по словам в подписи. Текст и картинку для сетки держите в центре — края срезаются в превью 3:4.</p></section>';
  }

  // ================================================================ привязка полей
  function getPath(o, path){ return path.split(".").reduce((a, k) => a == null ? undefined : a[k], o); }
  function setPath(o, path, v){
    const ks = path.split(".");
    let cur = o;
    for (let i = 0; i < ks.length - 1; i++){
      const k = ks[i], nk = ks[i + 1];
      if (cur[k] == null || typeof cur[k] !== "object") cur[k] = /^\d+$/.test(nk) ? [] : {};
      cur = cur[k];
    }
    cur[ks[ks.length - 1]] = v;
  }
  const productTimers = {};
  function onBound(el, isChange){
    const bind = el.dataset.bind;
    const [scope, a, b] = bind.split(":");
    let v = el.type === "checkbox" ? el.checked : el.value;
    if (el.dataset.kind === "tags") v = normTags(v);
    if (el.type === "number" && v !== "") v = Number(v);
    if (scope === "slot"){
      const s = slotById(a); if (!s) return;
      if (b === "productId" && v === "__new"){ const p = addProduct(); s.productId = p.id; persistSlots(); go("profile/product/" + p.id); return; }
      if (b === "goal" && v === "sales" && !s.codeWord && S.brand.codeWord) s.codeWord = S.brand.codeWord;
      setPath(s, b, v); touch(s);
      if (b === "publishedAt" && v && !s.imageAt && !hasThumb(s)) s.imageAt = v;
      persistSlotsSoon();
    } else if (scope === "brand"){
      if (a.indexOf("rubrics.") === 0 && !S.brand.rubrics) S.brand.rubrics = JSON.parse(JSON.stringify(P.DEFAULT_RUBRICS));
      setPath(S.brand, a, v);
      clearTimeout(productTimers.brand); productTimers.brand = setTimeout(persistBrand, 600);
    } else if (scope === "product"){
      const p = productById(a); if (!p) return;
      setPath(p, b, v);
      clearTimeout(productTimers[a]); productTimers[a] = setTimeout(() => persistProduct(p), 600);
    } else if (scope === "collab"){
      const c = S.collabs.find(x => x.id === a); if (!c) return;
      setPath(c, b, v); persistCollabs();
    } else if (scope === "ui"){
      if (b) setPath(S.ui[a] = S.ui[a] || {}, b, v); else S.ui[a] = v;
    }
    if (isChange && el.hasAttribute("data-rerender")) renderView(true);
  }
  function addProduct(){
    const p = {id: uid(), name: "", benefits: [], createdAt: new Date().toISOString()};
    S.products.push(p); persistProduct(p);
    return p;
  }

  // ================================================================ действия
  const H = {};
  H.back = el => goBack(el.dataset.fallback);
  H.hideOnboard = () => { lsSet("atelier.onboard.hide", true); renderView(); };
  H.feedView = el => { S.ui.feedView = el.dataset.v; lsSet("atelier.ui.feedView", el.dataset.v); renderView(); };
  H.feedFilter = el => { S.ui.feedFilter = el.dataset.v; renderView(); };
  H.postTab = el => { S.ui.postTab = el.dataset.v; renderView(true); const t = $(".tabs.sticky"); if (t && t.getBoundingClientRect().top < 0) t.scrollIntoView(); };
  H.togglePrompt = () => { S.ui.promptOpen = !S.ui.promptOpen; renderView(true); };
  H.stopQueue = () => { if (S.queue) S.queue.stop = true; renderView(true); };
  H.newPost = async () => { closeSheet(); const s = newSlot(); await persistSlots(); S.ui.postTab = "image"; go("post/" + s.id); };
  H.newTest = async () => { const s = newSlot({pillarType: "REELS", trial: true, goal: "reach", note: "Пробный Reels: одна идея, 2–3 версии начала"}); await persistSlots(); S.ui.postTab = "extra"; go("post/" + s.id); };
  H.openCreate = () => showSheet('<h3>Создать</h3><div class="sheet-list">'
    + '<button data-act="newPost">' + icon("plus") + "<span><b>Один пост</b><small>на следующую свободную дату</small></span></button>"
    + '<a href="#/plan-new/week" data-act="closeSheet">' + icon("spark") + "<span><b>План на неделю</b><small>" + (clamp(num(S.brand.postsPerWeek) || 5, 1, 14)) + " постов по ритму и рубрикам</small></span></a>"
    + '<a href="#/plan-new/custom" data-act="closeSheet">' + icon("grid") + "<span><b>План на N постов</b><small>сколько угодно, с выбором даты</small></span></a>"
    + '<button data-act="newTest">' + icon("film") + "<span><b>Пробный Reels</b><small>тест 2–3 версий начала</small></span></button></div>");
  H.closeSheet = () => closeSheet();
  H.postMenu = () => { const s = slotById(route().a); if (s) showSheet(postMenu(s)); };

  H.slotSet = el => {
    const s = slotById(el.dataset.id); if (!s) return;
    const f = el.dataset.f, v = el.dataset.v;
    s[f] = v; touch(s);
    if (f === "pillarType" && v === "QUOTE") s.productId = "";
    persistSlots(); renderView(true);
  };
  H.toggleProp = el => {
    const s = slotById(el.dataset.id); if (!s) return;
    s.defaults = s.defaults || {};
    const props = s.defaults.props = s.defaults.props || [];
    const i = props.indexOf(el.dataset.v);
    if (i >= 0) props.splice(i, 1); else props.push(el.dataset.v);
    touch(s); persistSlotsSoon(); renderView(true);
  };
  H.createAll = el => { const s = slotById(el.dataset.id); if (s) createAll(s); };
  H.rebuildAll = el => { closeSheet(); const s = slotById(el.dataset.id); if (s && confirm("Пересоздать промт и весь текст поста заново?")) createAll(s, {redo: true}); };
  H.templateOnly = async el => {
    const s = slotById(el.dataset.id); if (!s) return;
    S.undo[s.id + ":prompt"] = s.linkedPromptId;
    await setPrompt(s, buildTemplate(s), "template");
    toast("Промт собран по шаблону."); renderView(true);
  };
  H.gen = async el => {
    const s = slotById(el.dataset.id), what = el.dataset.what;
    if (!s || needKey()) return;
    const key = "gen:" + s.id + ":" + what;
    const labels = {prompt: "Пишу промт…", caption: "Пишу текст…", reels: "Пишу сценарий…", stories: "Придумываю сторис…", layout: "Готовлю макет…"};
    if (what === "caption" && s.caption && !confirm("Переписать подпись, хэштеги, alt-текст и первый комментарий заново?")) return;
    setBusy(key, labels[what]);
    try{
      if (what === "prompt"){ S.undo[s.id + ":prompt"] = s.linkedPromptId; await makePrompt(s); }
      else if (what === "caption"){ S.undo[s.id + ":caption"] = s.caption; await makeCaption(s); }
      else if (what === "reels") await makeReels(s);
      else if (what === "stories") await makeStories(s);
      else if (what === "layout") await makeLayout(s);
      toast("Готово.");
    }catch(e){ toast(P.errorText(e), true); }
    setBusy(key, null);
  };
  H.refine = async (el) => {
    const s = slotById(el.dataset.id); if (!s || needKey()) return;
    const kind = el.dataset.kind, field = el.dataset.field;
    let wish = el.dataset.wish;
    if (!wish){ const inp = el.closest(".refine") && $("[data-refine-input]", el.closest(".refine")); wish = inp ? inp.value.trim() : ""; }
    if (!wish){ toast("Напишите пожелание или выберите готовое.", true); return; }
    const key = "refine:" + s.id + ":" + field;
    setBusy(key, "…");
    try{
      if (kind === "prompt"){
        const cur = promptText(s);
        S.undo[s.id + ":prompt"] = s.linkedPromptId;
        if (wish === "Другая сцена"){ await makePrompt(s, "полностью другая сцена: другая локация, свет и ракурс, чем в текущем промте"); }
        else {
          const res = await ai(P.refineRequest("prompt", cur, wish, {slot: s, product: productOf(s), used: usedScenes(s.id)}), {maxTokens: 6000});
          const parsed = P.parseSceneLine(res.text);
          if (parsed.scene) s.scene = parsed.scene;
          await setPrompt(s, parsed.prompt, "ai");
        }
      } else {
        S.undo[s.id + ":" + field] = s[field];
        const res = await ai(P.refineRequest(kind, s[field], wish, {slot: s, product: productOf(s), brand: S.brand}), {modelTier: kind === "caption" ? undefined : "quick", maxTokens: 3500});
        s[field] = res.text.trim(); touch(s); await persistSlots();
      }
      toast("Доработано. Не понравилось — ↶ отменит.");
    }catch(e){ toast(P.errorText(e), true); }
    setBusy(key, null);
  };
  H.undo = async el => {
    const s = slotById(el.dataset.id); if (!s) return;
    const field = el.dataset.field, k = s.id + ":" + field;
    if (!(k in S.undo)) return;
    const prev = S.undo[k]; delete S.undo[k];
    if (field === "prompt"){ if (prev){ s.linkedPromptId = prev; touch(s); await persistSlots(); } }
    else { s[field] = prev; touch(s); await persistSlots(); }
    toast("Вернула прошлый вариант."); renderView(true);
  };
  H.copy = el => copyText(el.dataset.text || "");
  H.copyPrompt = el => {
    const s = slotById(el.dataset.id); if (!s) return;
    copyText(promptText(s), "Промт скопирован — вставьте в ChatGPT и приложите фото товара и референс.");
    S.ui.copied[s.id] = true; renderView(true);
  };
  H.copyStory = el => { const s = slotById(el.dataset.id); if (s) copyText(P.toStoryFormat(promptText(s)), "Промт 9:16 скопирован."); };
  H.copyCaptionAll = el => {
    const s = slotById(el.dataset.id); if (!s) return;
    const tags = (s.hashtags || []).join(" ");
    copyText(s.caption + (tags ? "\n\n" + tags : ""), "Подпись с хэштегами скопирована.");
  };
  H.copyMaster = el => { closeSheet(); const p = productById(el.dataset.pid); if (p) copyText(P.masterShotPrompt(p), "Промт мастер-кадра скопирован — приложите в ChatGPT 3–4 фото товара."); };
  H.publish = async el => {
    const s = slotById(el.dataset.id); if (!s) return;
    s.publishedAt = todayIso(); if (!s.imageAt && !hasThumb(s)) s.imageAt = s.publishedAt; touch(s);
    await persistSlots(); toast("Отмечено: опубликован. Через 1–3 дня внесите статистику."); renderView(true);
  };
  H.removeImage = async el => {
    const s = slotById(el.dataset.id); if (!s || !confirm("Убрать картинку из поста?")) return;
    delete S.thumbs[s.id]; s.imageAt = ""; s.qa = null; touch(s);
    await saveDoc("thumbs/" + s.id, {data: null}); await persistSlots(); renderView(true);
  };
  H.qa = async el => {
    const s = slotById(el.dataset.id); if (!s || needKey()) return;
    const key = "qa:" + s.id;
    setBusy(key, "Проверяю…");
    try{
      let file = S.lastImage[s.id];
      if (!file && S.thumbs[s.id]) file = asFile(await (await fetch(S.thumbs[s.id])).blob());
      if (!file) throw {code: "image_rejected"};
      const r = await aiJson(P.qaRequest({slot: s, product: productOf(s), promptText: promptText(s)}), {images: file, maxTokens: 2000});
      s.qa = {verdict: r.verdict === "ok" ? "ok" : "redo", summary: r.summary || "", checks: Array.isArray(r.checks) ? r.checks : [], fixes: Array.isArray(r.fixes) ? r.fixes : [], at: new Date().toISOString()};
      touch(s); await persistSlots();
    }catch(e){ toast(P.errorText(e, "Проверка не удалась"), true); }
    setBusy(key, null);
  };
  H.applyFixes = async el => {
    const s = slotById(el.dataset.id); if (!s || !s.qa || needKey()) return;
    const key = "fix:" + s.id;
    setBusy(key, "Правлю промт…");
    try{
      S.undo[s.id + ":prompt"] = s.linkedPromptId;
      const res = await ai(P.applyFixesRequest(promptText(s), s.qa.fixes), {maxTokens: 6000});
      await setPrompt(s, res.text.trim(), "ai");
      S.ui.copied[s.id] = false;
      toast("Промт исправлен — скопируйте его и перегенерируйте картинку.");
    }catch(e){ toast(P.errorText(e), true); }
    setBusy(key, null);
  };
  H.testToInsight = async el => {
    const s = slotById(el.dataset.id); if (!s || !s.testResult.trim()) { toast("Сначала запишите итог теста.", true); return; }
    S.insights.items.unshift({id: uid(), date: todayIso(), text: "Тест Reels №" + s.num + ": " + s.testResult.trim()});
    await persistInsights(); toast("Добавлено в выводы аккаунта.");
  };
  H.move = async el => {
    closeSheet();
    const s = slotById(el.dataset.id); if (!s) return;
    const i = S.slots.indexOf(s), j = i + Number(el.dataset.v);
    const o = S.slots[j]; if (!o) return;
    [s.date, o.date] = [o.date, s.date]; [s.time, o.time] = [o.time, s.time];
    S.slots[i] = o; S.slots[j] = s; touch(s); touch(o);
    await persistSlots(); toast("Поменяла местами с №" + o.num + " (вместе с датами)."); renderView(true);
  };
  H.duplicate = async el => {
    closeSheet();
    const s = slotById(el.dataset.id); if (!s) return;
    const c = newSlot({pillarType: s.pillarType, rubric: s.rubric, goal: s.goal, productId: s.productId, note: s.note, defaults: s.defaults, textMode: s.textMode, trial: s.trial});
    await persistSlots(); go("post/" + c.id);
  };
  H.deletePost = async el => {
    closeSheet();
    const s = slotById(el.dataset.id); if (!s || !confirm("Удалить пост №" + s.num + "? Это нельзя отменить.")) return;
    S.slots.splice(S.slots.indexOf(s), 1);
    await persistSlots();
    if (S.thumbs[s.id]){ delete S.thumbs[s.id]; saveDoc("thumbs/" + s.id, {data: null}); }
    toast("Пост удалён."); go("feed");
  };
  H.generatePlan = () => { if (!S.ui.wizBusy) generatePlan(); };

  // идеи
  H.genIdeas = async () => {
    if (needKey()) return;
    setBusy("ideas", "Придумываю…");
    try{
      const arr = await aiJson(P.ideasBankRequest({rubric: S.ui.ideaRubric || "", rubrics: rubricsOf(), brand: S.brand, insights: S.insights.items,
        products: S.products.map(p => p.name).filter(Boolean).join(", "), recent: S.slots.slice(-15).map(P.slotLine).join("\n")}), {modelTier: "quick", maxTokens: 3000});
      addIdeas(Array.isArray(arr) ? arr : [], "ИИ");
      await persistIdeas();
    }catch(e){ toast(P.errorText(e), true); }
    setBusy("ideas", null);
  };
  function addIdeas(arr, source){
    arr.filter(x => x && x.text).reverse().forEach(x => S.ideas.unshift({id: uid(), text: String(x.text), type: P.PILLARS[x.type] ? x.type : "", rubric: x.rubric || "",
      goal: P.GOALS[x.goal] ? x.goal : "", why: x.why || "", source, createdAt: new Date().toISOString()}));
  }
  H.addIdea = async () => {
    const inp = $("#ideaNew"); const t = inp && inp.value.trim(); if (!t) return;
    addIdeas([{text: t}], "своя"); await persistIdeas(); renderView();
  };
  H.delIdea = async el => { S.ideas = S.ideas.filter(x => x.id !== el.dataset.id); await persistIdeas(); renderView(true); };
  H.ideaToPlan = async el => {
    const it = S.ideas.find(x => x.id === el.dataset.id); if (!it) return;
    const type = it.type || "MOOD";
    const s = newSlot({pillarType: type, rubric: it.rubric || defaultRubricGoal(type).rubric, goal: it.goal || defaultRubricGoal(type).goal, note: it.text});
    S.ideas = S.ideas.filter(x => x.id !== it.id);
    await persistSlots(); await persistIdeas();
    toast("Пост №" + s.num + " добавлен на " + fmtDate(s.date) + "."); renderView(true);
  };
  H.eventPost = async el => {
    const d = el.dataset;
    const date = addDays(d.date, -Math.min(5, Number(d.lead) || 5));
    const s = newSlot({pillarType: "CAROUSEL", rubric: "Товар", goal: "sales", date: date < todayIso() ? addDays(todayIso(), 1) : date,
      event: d.title + " (" + fmtAbs(d.date) + ")" + (d.idea ? ": " + d.idea : ""), note: "Подборка к поводу «" + d.title + "»" + (d.idea ? ": " + d.idea : "")});
    await persistSlots(); go("post/" + s.id);
  };
  H.rivalIdea = async el => {
    const r = S.ui.results.rival; const it = r && r.ideas && r.ideas[Number(el.dataset.i)]; if (!it) return;
    addIdeas([it], "конкурент"); await persistIdeas(); el.disabled = true; el.textContent = "В банке ✓";
  };

  // рост
  H.genReview = async () => {
    if (needKey()) return;
    const from = Number(S.ui.rangeFrom) || 0, to = Number(S.ui.rangeTo) || Infinity;
    const items = S.slots.filter(s => s.num >= Math.min(from, to) && s.num <= Math.max(from, to));
    if (!items.length){ toast("В этом диапазоне нет постов.", true); return; }
    setBusy("review", "Проверяю…");
    try{
      const d0 = items.map(s => s.date).filter(Boolean).sort()[0] || todayIso();
      const evs = P.upcomingEvents(d0, 45, customEvents()).map(e => e.title + " " + fmtDate(e.date)).join(", ");
      const res = await ai(P.reviewRangeRequest({from: items[0].num, to: items[items.length - 1].num, lines: items.map(P.slotLine).join("\n"),
        rubrics: rubricsOf().map(r => r.name + " " + r.share + "%").join(", "), events: evs}), {maxTokens: 3000});
      S.ui.results.review = res.text.trim();
    }catch(e){ toast(P.errorText(e), true); }
    setBusy("review", null);
  };
  H.genGrid = async () => {
    if (needKey()) return;
    const lines = S.slots.filter(s => !s.publishedAt).slice(0, 9).reverse().map(s => P.slotLine(s) + (s.scene ? " · сцена: " + [s.scene.location, s.scene.light].filter(Boolean).join(", ") : "") + (effTextMode(s) === "B" || s.pillarType === "QUOTE" || s.pillarType === "HERO" ? " · с текстом" : "")).join("\n");
    if (!lines){ toast("Нет неопубликованных постов.", true); return; }
    setBusy("grid", "Разбираю…");
    try{ S.ui.results.grid = (await ai(P.gridRequest(lines), {modelTier: "quick", maxTokens: 1500})).text.trim(); }
    catch(e){ toast(P.errorText(e), true); }
    setBusy("grid", null);
  };
  H.genInsights = async () => {
    if (needKey()) return;
    const rows = statRows();
    if (rows.length < 2){ toast("Нужны цифры хотя бы у 2 постов.", true); return; }
    setBusy("insights", "Анализирую…");
    try{
      const r = await aiJson(P.insightsRequest({rows: postsForAI(rows), followers: S.followers.map(f => f.month + ": " + f.count).join(", ")}), {maxTokens: 3000});
      (r.insights || []).slice().reverse().forEach(t => S.insights.items.unshift({id: uid(), date: todayIso(), text: String(t)}));
      S.insights.items = S.insights.items.slice(0, 30);
      S.insights.advice = Array.isArray(r.advice) ? r.advice.map(String) : [];
      S.insights.summary = r.summary || "";
      await persistInsights();
    }catch(e){ toast(P.errorText(e), true); }
    setBusy("insights", null);
  };
  H.genReport = async () => {
    if (needKey()) return;
    const month = S.ui.reportMonth || todayIso().slice(0, 7);
    const rows = statRows().filter(r => (r.s.publishedAt || r.s.date || "").slice(0, 7) === month);
    if (!rows.length){ toast("За " + month + " нет постов с цифрами.", true); return; }
    setBusy("report", "Пишу отчёт…");
    try{
      const r = await aiJson(P.insightsRequest({month, rows: postsForAI(rows), followers: S.followers.map(f => f.month + ": " + f.count).join(", ")}), {maxTokens: 3500});
      S.insights.report = [r.summary, (r.insights || []).map(x => "— " + x).join("\n"), (r.advice || []).length ? "Гипотезы и шаги:\n" + r.advice.map((x, i) => (i + 1) + ". " + x).join("\n") : ""].filter(Boolean).join("\n\n");
      S.insights.reportMonth = month;
      await persistInsights();
    }catch(e){ toast(P.errorText(e), true); }
    setBusy("report", null);
  };
  H.addInsight = async () => { const inp = $("#insightNew"); const t = inp && inp.value.trim(); if (!t) return; S.insights.items.unshift({id: uid(), date: todayIso(), text: t}); await persistInsights(); renderView(true); };
  H.delInsight = async el => { S.insights.items = S.insights.items.filter(x => x.id !== el.dataset.id); await persistInsights(); renderView(true); };
  H.addFollowers = async () => {
    const m = $("#folMonth").value, c = num($("#folCount").value); if (!m || !c) return;
    S.followers = S.followers.filter(f => f.month !== m).concat([{month: m, count: c}]); await persistFollowers(); renderView(true);
  };
  H.delFollowers = async el => { S.followers = S.followers.filter(f => f.month !== el.dataset.m); await persistFollowers(); renderView(true); };
  H.addCollab = async () => {
    const h = $("#colHandle").value.trim(); if (!h) return;
    S.collabs.unshift({id: uid(), handle: h, followers: $("#colFollowers").value.trim(), niche: $("#colNiche").value.trim(), status: "идея"});
    await persistCollabs(); renderView(true);
  };
  H.delCollab = async el => { S.collabs = S.collabs.filter(c => c.id !== el.dataset.id); await persistCollabs(); renderView(true); };
  H.genCollab = async el => {
    if (needKey()) return;
    const kind = el.dataset.kind, c = el.dataset.id ? S.collabs.find(x => x.id === el.dataset.id) : null;
    const key = "collab:" + kind + (c ? ":" + c.id : "");
    setBusy(key, "Пишу…");
    try{ S.ui.results[key] = (await ai(P.collabRequest(kind, {brand: S.brand, candidate: c, products: S.products.map(p => p.name).filter(Boolean).join(", ")}), {modelTier: "quick", maxTokens: 2000})).text.trim(); }
    catch(e){ toast(P.errorText(e), true); }
    setBusy(key, null);
  };

  // профиль
  H.theme = el => { const v = el.dataset.v; lsSet("atelier.theme", v); applyTheme(); renderView(true); };
  H.newProduct = () => { const p = addProduct(); go("profile/product/" + p.id); };
  H.delProduct = async el => {
    const p = productById(el.dataset.id); if (!p || !confirm("Удалить товар «" + (p.name || "без названия") + "»?")) return;
    S.products = S.products.filter(x => x.id !== p.id);
    S.slots.forEach(s => { if (s.productId === p.id) s.productId = ""; });
    await saveDoc("products/" + p.id, {deleted: true}); await persistSlots(); go("profile/products");
  };
  H.addRubric = () => { S.brand.rubrics = (S.brand.rubrics || JSON.parse(JSON.stringify(P.DEFAULT_RUBRICS))).concat([{name: "Новая", share: 0, goal: "saves"}]); persistBrand(); renderView(true); };
  H.delRubric = el => { S.brand.rubrics = (S.brand.rubrics || JSON.parse(JSON.stringify(P.DEFAULT_RUBRICS))); S.brand.rubrics.splice(Number(el.dataset.i), 1); persistBrand(); renderView(true); };
  H.addCustom = async el => {
    const k = el.dataset.k, inp = $("#add-" + k), v = inp && inp.value.trim(); if (!v) return;
    if (allList(k).indexOf(v) < 0) S.custom[k] = (S.custom[k] || []).concat([v]);
    await persistCustom(); renderView(true);
  };
  H.delCustom = async el => { const k = el.dataset.k; S.custom[k] = (S.custom[k] || []).filter((_, i) => i !== Number(el.dataset.i)); await persistCustom(); renderView(true); };
  H.addComposition = async () => {
    const l = $("#compLabel").value.trim(), d = $("#compDesc").value.trim(); if (!l || !d) { toast("Нужны название и описание.", true); return; }
    S.custom.compositions = (S.custom.compositions || []).concat([{label: l, desc: d}]); await persistCustom(); renderView();
  };
  function readConn(){
    return {anthropicKey: $("#cfgAnthKey").value.trim(), modelDefault: $("#cfgModelDefault").value, modelQuick: $("#cfgModelQuick").value,
      supaUrl: $("#cfgSupaUrl").value.trim(), supaKey: $("#cfgSupaKey").value.trim()};
  }
  H.saveConn = () => {
    const before = cfg(), f = readConn();
    A.setCfg(f);
    if (before.supaUrl !== f.supaUrl || before.supaKey !== f.supaKey){ toast("Сохранено. Перезагружаю с новой базой…"); setTimeout(() => location.reload(), 700); return; }
    toast("Подключение сохранено."); renderView(true);
  };
  H.testAnth = async () => {
    const st = $("#anthStatus"); const before = cfg(); A.setCfg(readConn());
    st.textContent = "проверяю…";
    try{ st.textContent = await A.testAnthropic(); }
    catch(e){ st.textContent = P.errorText(e); A.setCfg({anthropicKey: before.anthropicKey}); }
  };
  H.testSupa = async () => {
    const st = $("#supaStatus"); const before = cfg(); const f = readConn();
    A.setCfg({supaUrl: f.supaUrl, supaKey: f.supaKey});
    st.textContent = "проверяю…";
    try{ st.textContent = await A.testSupabase(); }
    catch(e){ st.textContent = P.errorText(e, e.message || "ошибка"); }
    A.setCfg({supaUrl: before.supaUrl, supaKey: before.supaKey});
  };
  H.export = () => {
    const data = {version: 2, exportedAt: new Date().toISOString(), slots: S.slots, prompts: S.prompts, custom: S.custom, brand: S.brand, products: S.products,
      ideas: S.ideas, insights: S.insights, collabs: S.collabs, followers: S.followers, competitors: S.competitors};
    if ($("#expThumbs") && $("#expThumbs").checked) data.thumbs = S.thumbs;
    const blob = new Blob([JSON.stringify(data, null, 1)], {type: "application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "atelier-backup-" + todayIso() + ".json";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("Копия скачана.");
  };
  H.import = async () => {
    const f = $("#importFile") && $("#importFile").files[0]; if (!f){ toast("Выберите файл.", true); return; }
    let data;
    try{ data = JSON.parse(await f.text()); }catch(e){ toast("Файл не читается как JSON.", true); return; }
    if (!data || !Array.isArray(data.slots)){ toast("В файле нет плана (slots).", true); return; }
    if (!confirm("Заменить текущие данные данными из файла? Постов в файле: " + data.slots.length + ".")) return;
    S.slots = data.version >= 2 ? data.slots.map(normalizeSlot) : migrateSlots(data.slots);
    if (data.custom) Object.keys(S.custom).forEach(k => { if (Array.isArray(data.custom[k])) S.custom[k] = data.custom[k]; });
    await persistSlots(); await persistCustom();
    for (const p of (data.prompts || [])){ if (p && p.id){ await saveDoc("prompts/" + p.id, p); } }
    S.prompts = (data.prompts || []).slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    if (data.version >= 2){
      if (data.brand){ S.brand = data.brand; await persistBrand(); }
      for (const p of (data.products || [])){ if (p && p.id) await saveDoc("products/" + p.id, p); }
      S.products = (data.products || []).filter(p => p && p.id && !p.deleted);
      S.ideas = data.ideas || []; await persistIdeas();
      S.insights = Object.assign({items: [], advice: [], summary: "", report: ""}, data.insights || {}); await persistInsights();
      S.collabs = data.collabs || []; await persistCollabs();
      S.followers = data.followers || []; await persistFollowers();
      S.competitors = data.competitors || []; await persistCompetitors();
      if (data.thumbs) for (const id of Object.keys(data.thumbs)){ if (data.thumbs[id]){ S.thumbs[id] = data.thumbs[id]; await saveDoc("thumbs/" + id, {data: data.thumbs[id]}); } }
    }
    toast("Загружено постов: " + S.slots.length + "."); go("feed");
  };

  // ================================================================ загрузка файлов
  async function onUpload(el){
    const file = el.files && el.files[0]; el.value = "";
    if (!file) return;
    if (!/^image\//.test(file.type)){ toast("Нужна картинка (PNG, JPG, WEBP).", true); return; }
    const kind = el.dataset.upload, s = el.dataset.id ? slotById(el.dataset.id) : null;
    try{
      if (kind === "image" && s){
        const th = await resize(file, 540, 0.78);
        const full = await resize(file, 1568, 0.86);
        S.lastImage[s.id] = asFile(full.blob);
        S.thumbs[s.id] = th.dataUrl; s.imageAt = todayIso(); s.qa = null; touch(s);
        await saveDoc("thumbs/" + s.id, {data: th.dataUrl, updatedAt: new Date().toISOString()});
        await persistSlots();
        renderView(true);
        if (hasKey()) H.qa({dataset: {id: s.id}});
        else toast("Картинка добавлена. С ключом Claude её можно автоматически проверить.");
        return;
      }
      if (needKey()) return;
      const shot = await screenshotFile(file);
      if (kind === "metrics" && s){
        setBusy("metrics:" + s.id, "Читаю цифры…");
        try{
          const r = await aiJson(P.metricsFromScreenshotRequest(s.pillarType === "REELS"), {images: shot, modelTier: "quick", maxTokens: 600});
          s.metrics = s.metrics || {};
          METRICS.concat([["watch"]]).forEach(([k]) => { if (r[k] != null && r[k] !== "") s.metrics[k] = k === "watch" ? String(r[k]) : num(r[k]); });
          if (!s.publishedAt) s.publishedAt = s.date && s.date <= todayIso() ? s.date : todayIso();
          touch(s); await persistSlots(); toast("Цифры заполнены — проверьте их.");
        } finally { setBusy("metrics:" + s.id, null); }
        return;
      }
      const lines = S.slots.filter(x => !x.publishedAt).slice(0, 9).map(P.slotLine).join("\n");
      const jobs = {
        feedShot: ["Смотрю ленту…", () => ai(P.feedScreenshotRequest(lines), {images: shot, maxTokens: 2000}).then(r => { S.ui.results.feedShot = r.text.trim(); })],
        audit: ["Проверяю профиль…", () => ai(P.profileAuditRequest(S.brand), {images: shot, maxTokens: 2500}).then(r => { S.ui.results.audit = r.text.trim(); })],
        rival: ["Разбираю…", () => aiJson(P.competitorRequest({brand: S.brand, name: S.ui.rivalName}), {images: shot, maxTokens: 3000}).then(async r => {
          S.ui.results.rival = r;
          S.competitors.unshift({id: uid(), date: todayIso(), name: S.ui.rivalName || "", result: r});
          S.competitors = S.competitors.slice(0, 20); await persistCompetitors();
        })]
      };
      const job = jobs[kind]; if (!job) return;
      setBusy(kind, job[0]);
      try{ await job[1](); } finally { setBusy(kind, null); }
    }catch(e){ toast(P.errorText(e, "Не получилось"), true); }
  }

  // ================================================================ мелочи интерфейса
  let toastTimer = null;
  function toast(text, warn){
    const t = $("#toast"); if (!t) return;
    t.textContent = text; t.className = "toast show" + (warn ? " warn" : "");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.className = "toast"; }, warn ? 5200 : 2600);
  }
  async function copyText(text, msg){
    if (!text){ toast("Пока нечего копировать.", true); return; }
    try{ await navigator.clipboard.writeText(text); }
    catch(e){
      const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); }catch(_){} ta.remove();
    }
    toast(msg || "Скопировано.");
  }
  function showSheet(html){
    const sh = $("#sheet");
    sh.innerHTML = '<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet-body" role="dialog" aria-modal="true"><div class="grab"></div>' + html + "</div>";
    sh.hidden = false; requestAnimationFrame(() => sh.classList.add("open"));
  }
  function closeSheet(){ const sh = $("#sheet"); if (!sh || sh.hidden) return; sh.classList.remove("open"); setTimeout(() => { sh.hidden = true; sh.innerHTML = ""; }, 180); }
  function applyTheme(){ const t = lsGet("atelier.theme", ""); if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }

  // ================================================================ события
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    if (!H[act]) return;
    if (el.tagName !== "A" || act !== "closeSheet") e.preventDefault();
    if (el.tagName === "A" && act === "closeSheet"){ closeSheet(); return; }
    if (el.disabled) return;
    Promise.resolve(H[act](el, e)).catch(err => toast(P.errorText(err), true));
  });
  document.addEventListener("input", e => {
    const el = e.target;
    if (el.tagName === "TEXTAREA") autosize(el);
    if (el.dataset && el.dataset.bind && el.type !== "checkbox" && el.tagName !== "SELECT") onBound(el, false);
  });
  document.addEventListener("change", e => {
    const el = e.target;
    if (el.dataset.upload){ onUpload(el); return; }
    if (el.dataset.promptEdit){
      const s = slotById(el.dataset.promptEdit);
      if (s && el.value.trim() && el.value !== promptText(s)){ S.undo[s.id + ":prompt"] = s.linkedPromptId; setPrompt(s, el.value, "manual"); }
      return;
    }
    if (el.dataset.bind) onBound(el, true);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeSheet();
    if (e.key === "Enter" && e.target.matches && e.target.matches("[data-refine-input]")){ e.preventDefault(); const b = e.target.parentNode.querySelector('[data-act="refine"]'); if (b) b.click(); }
  });
  document.addEventListener("toggle", e => { const d = e.target; if (d.dataset && d.dataset.actToggle) S.ui[d.dataset.actToggle] = d.open; }, true);
  window.addEventListener("hashchange", () => {
    S.ui.navCount++;
    closeSheet();
    const r = route();
    if (r.name === "post" && r.a !== S.ui.lastPostId){ S.ui.postTab = "image"; S.ui.promptOpen = false; S.ui.lastPostId = r.a; }
    if (r.name !== "plan-new") S.ui.wiz = null;
    renderView();
  });

  // ================================================================ старт
  async function boot(){
    applyTheme();
    renderView();
    S.db = await window.claude.use("db");
    S.sample = await window.claude.use("sample");
    try{
      const get = async path => { const d = await S.db.doc(path).get(); return d.exists ? d.data() : undefined; };
      const [plan, custom, brand, ideas, insights, collabs, followers, comps, prompts, products] = await Promise.all([
        get("plan/main"), get("config/customLists"), get("config/brand"), get("config/ideas"), get("config/insights"),
        get("config/collabs"), get("config/followers"), get("config/competitors"),
        S.db.collection("prompts").get(), S.db.collection("products").get()
      ]);
      const raw = plan && Array.isArray(plan.slots) ? plan.slots : [];
      const needsMigration = raw.some(s => !s.num);
      S.slots = migrateSlots(raw);
      if (custom) Object.keys(S.custom).forEach(k => { S.custom[k] = Array.isArray(custom[k]) ? custom[k] : []; });
      S.brand = brand || {};
      S.ideas = ideas && Array.isArray(ideas.items) ? ideas.items : [];
      S.insights = Object.assign({items: [], advice: [], summary: "", report: ""}, insights || {});
      S.collabs = collabs && Array.isArray(collabs.items) ? collabs.items : [];
      S.followers = followers && Array.isArray(followers.items) ? followers.items : [];
      S.competitors = comps && Array.isArray(comps.items) ? comps.items : [];
      S.prompts = prompts.docs.map(d => d.data()).filter(Boolean).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      S.products = products.docs.map(d => d.data()).filter(p => p && p.id && !p.deleted).sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
      S.online = true;
      S.loaded = true;
      if (window.__atelierStale) toast("Нет связи — показаны сохранённые на устройстве данные.", true);
      renderView();
      if (needsMigration && S.slots.length) persistSlots();
    }catch(e){
      S.online = false; S.loaded = true;
      toast(P.errorText(e, "Не удалось загрузить данные"), true);
      renderView();
      return;
    }
    try{
      const th = await S.db.collection("thumbs").get();
      th.docs.forEach(d => { const v = d.data(); if (v && v.data) S.thumbs[d.id] = v.data; });
      renderView(true);
    }catch(e){}
  }
  boot();
})();
