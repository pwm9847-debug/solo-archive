(function () {
  var S = window.SITE, M = window.MATERIALS, STAGES = window.STAGES;
  // 자료가 하나도 없는 분류는 숨겨요
  var CATS = window.CATS.filter(function (c) { return M.some(function (m) { return m.cat === c.key; }); });
  var $ = function (id) { return document.getElementById(id); };
  var state = { cat: "전체", stage: "전체", q: "" };
  var current = null;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function store(key, val) {
    try { if (val === undefined) return JSON.parse(localStorage.getItem(key)); localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; }
  }
  function byId(id) { return M.filter(function (m) { return m.id === id; })[0]; }
  function sorted() { return M.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }); }

  /* --- 기본 문구 --- */
  document.title = S.name + " (" + S.author + ")";
  $("logo").textContent = S.name;
  $("footName").textContent = "© " + S.name + " · " + S.author;
  $("heroEyebrow").textContent = "ARCHIVE NO. " + String(M.length).padStart(3, "0") + " · 마지막 등재 " + sorted()[0].date;
  $("statCount").textContent = M.length;
  $("statCats").textContent = CATS.length;
  $("statLast").textContent = sorted()[0].date.slice(5);
  $("newsBtn").href = S.newsletterUrl || "#";
  $("reqBtn").href = S.requestFormUrl || "#";
  function say(m) { if (window.toast) window.toast(m); }
  if (!S.newsletterUrl) $("newsBtn").addEventListener("click", function (e) { e.preventDefault(); say("구독 페이지는 곧 열려요. 조금만 기다려 주세요."); });
  if (!S.requestFormUrl) $("reqBtn").addEventListener("click", function (e) { e.preventDefault(); say("요청 폼은 곧 열려요. 조금만 기다려 주세요."); });

  /* --- 칩 만들기 --- */
  function chips(box, items, active, onPick) {
    box.innerHTML = "";
    items.forEach(function (label) {
      var b = el("button", "chip" + (label === active ? " on" : ""), label);
      b.type = "button";
      b.addEventListener("click", function () { onPick(label); });
      box.appendChild(b);
    });
  }

  /* --- 전체 자료 --- */
  function renderGrid() {
    chips($("catChips"), ["전체"].concat(CATS.map(function (c) { return c.key; })), state.cat, function (v) { state.cat = v; renderGrid(); });
    var list = sorted().filter(function (m) {
      if (state.cat !== "전체" && m.cat !== state.cat) return false;
      if (state.stage !== "전체" && m.stages.indexOf(state.stage) < 0) return false;
      if (state.q) {
        var hay = (m.title + m.desc + m.cat + m.format).toLowerCase();
        if (hay.indexOf(state.q.toLowerCase()) < 0) return false;
      }
      return true;
    });
    var g = $("grid");
    g.innerHTML = "";
    list.forEach(function (m, i) { var c = card(m); c.style.setProperty("--d", (i * 0.05) + "s"); g.appendChild(c); });
    $("empty").hidden = list.length > 0;
  }
  function card(m) {
    var c = el("button", "card");
    c.type = "button";
    var top = el("div", "card-top");
    top.appendChild(el("span", "tag", m.cat));
    top.appendChild(el("span", "badge" + (m.access === "gate" ? " gate" : ""), m.access === "gate" ? "답변 후 받기" : "바로 받기"));
    c.appendChild(top);
    var h = el("h3"); h.appendChild(el("span", "", m.title));
    c.appendChild(h);
    c.appendChild(el("p", "", m.desc));
    var f = el("div", "card-foot");
    f.appendChild(el("span", "mono", m.id + " · " + m.date));
    f.appendChild(el("span", "", m.format + " " + m.pages + " · 개정 " + m.rev));
    c.appendChild(f);
    c.addEventListener("click", function () { openDrawer(m.id); });
    return c;
  }

  $("stageSel").innerHTML = "";
  ["전체"].concat(STAGES).forEach(function (s) {
    var o = el("option", "", s === "전체" ? "단계 전체" : s); o.value = s; $("stageSel").appendChild(o);
  });
  $("stageSel").addEventListener("change", function (e) { state.stage = e.target.value; renderGrid(); });
  $("q").addEventListener("input", function (e) {
    state.q = e.target.value.trim();
    renderGrid();
    if (state.q) $("materials").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* --- 처음이라면 --- */
  var pl = $("picks-list");
  M.filter(function (m) { return m.pick; }).forEach(function (m) {
    var li = el("li");
    li.appendChild(el("b", "", m.title));
    li.appendChild(el("small", "", m.cat));
    li.addEventListener("click", function () { openDrawer(m.id); });
    pl.appendChild(li);
  });
  var N = window.NOTE;
  $("noteMeta").textContent = "운영자 한마디 · " + N.date;
  $("noteTitle").textContent = N.title;
  N.body.forEach(function (t) { $("noteBody").appendChild(el("p", "", t)); });
  $("noteSign").textContent = S.author;

  /* --- 자료 찾기 --- */
  var f = { stage: null, scene: null };
  function renderFinder() {
    chips($("fStage"), STAGES, f.stage, function (v) { f.stage = v; renderFinder(); });
    chips($("fScene"), CATS.map(function (c) { return c.scene; }), f.scene, function (v) { f.scene = v; renderFinder(); });
    var out = $("fOut");
    if (!f.stage || !f.scene) { out.className = "finder-out"; out.textContent = "단계랑 장면을 고르면 여기에 자료가 떠요."; return; }
    var cat = CATS.filter(function (c) { return c.scene === f.scene; })[0].key;
    var hits = sorted().filter(function (m) { return m.cat === cat && m.stages.indexOf(f.stage) >= 0; });
    out.className = "finder-out has";
    out.innerHTML = "";
    if (!hits.length) { out.textContent = "딱 맞는 자료가 아직 없어요. 요청함에 남겨 주세요."; return; }
    hits.forEach(function (m) {
      var a = el("a");
      a.appendChild(el("span", "", m.title));
      a.appendChild(el("small", "", m.format + " " + m.pages));
      a.addEventListener("click", function () { openDrawer(m.id); });
      out.appendChild(a);
    });
  }

  /* --- 요청함 --- */
  var voted = store("voted") || {};
  function renderReq() {
    var ul = $("reqList"); ul.innerHTML = "";
    window.REQUESTS.slice().sort(function (a, b) { return b.votes - a.votes; }).forEach(function (r) {
      var li = el("li");
      var t = el("span", "t", r.title);
      t.appendChild(el("span", "w", r.who));
      li.appendChild(t);
      var on = !!voted[r.title];
      var b = el("button", "vote" + (on ? " on" : ""), "공감 " + (r.votes + (on ? 1 : 0)));
      b.type = "button";
      b.addEventListener("click", function () {
        voted[r.title] = !voted[r.title];
        store("voted", voted);
        renderReq();
      });
      li.appendChild(b);
      ul.appendChild(li);
    });
    var n = window.NEXT;
    $("next").innerHTML = "";
    $("next").appendChild(el("span", "mono", "다음에 올라올 자료 · " + n.tag));
    $("next").appendChild(el("h3", "", n.title));
    $("next").appendChild(el("p", "", n.desc));
    $("next").appendChild(el("p", "mono", n.when));
  }

  /* --- 상세 드로어 --- */
  function openDrawer(id) {
    var m = byId(id); if (!m) return;
    current = m;
    $("dMeta").textContent = m.id + " · " + m.date + " · " + m.cat;
    $("dTitle").textContent = m.title;
    $("dDesc").textContent = m.desc;
    var info = $("dInfo"); info.innerHTML = "";
    [["형식", m.format + " " + m.pages], ["대상", m.stages.join(" · ")], ["개정", m.rev + "회"]].forEach(function (r) {
      info.appendChild(el("dt", "", r[0])); info.appendChild(el("dd", "", r[1]));
    });
    var answered = (store("answers") || {})[m.id];
    $("gate").hidden = !(m.access === "gate" && !answered);
    $("getBox").hidden = !(m.access === "free" || answered);
    if (!$("getBox").hidden) setGet(m);
    $("ans").value = "";
    $("drawer").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function setGet(m) {
    var btn = $("getBtn");
    if (m.file) { btn.href = m.file; btn.setAttribute("download", S.name + " - " + m.title + ".pdf"); btn.removeAttribute("aria-disabled"); $("getNote").textContent = "가정이나 내 사업에서 쓰는 용도로 마음껏 쓰세요. 재배포만 말아 주세요."; }
    else { btn.href = "#"; btn.setAttribute("aria-disabled", "true"); $("getNote").textContent = "파일이 아직 연결되지 않았어요. data.js의 file 칸에 경로를 넣어 주세요."; }
  }
  $("getBtn").addEventListener("click", function (e) { if (this.getAttribute("aria-disabled") === "true") e.preventDefault(); });
  function closeDrawer() { $("drawer").hidden = true; document.body.style.overflow = ""; }
  document.querySelectorAll("[data-close]").forEach(function (n) { n.addEventListener("click", closeDrawer); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
    if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") { e.preventDefault(); $("q").focus(); }
  });

  $("gate").addEventListener("submit", function (e) {
    e.preventDefault();
    var text = $("ans").value.trim();
    if (text.length < 2) { $("ans").focus(); return; }
    var all = store("answers") || {};
    all[current.id] = text;
    store("answers", all);
    if (S.answerEndpoint) {
      try { fetch(S.answerEndpoint, { method: "POST", mode: "no-cors", body: new URLSearchParams({ material: current.id, answer: text }) }); } catch (err) {}
    }
    $("gate").hidden = true;
    $("getBox").hidden = false;
    setGet(current);
    say("남겨 주셔서 고마워요. 이제 받으실 수 있어요.");
  });
  $("getBtn").addEventListener("click", function () { if (this.getAttribute("aria-disabled") !== "true") say("다운로드를 시작했어요."); });

  renderGrid(); renderFinder(); renderReq();
})();
