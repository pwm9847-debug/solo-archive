/* 모션과 작은 부품들 (인트로, 진행 바, 떠오르는 효과, 토스트, 약관 창) */
(function () {
  var S = window.SITE, doc = document, body = doc.body;
  var $ = function (id) { return doc.getElementById(id); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /* --- 토스트 --- */
  var tt;
  window.toast = function (msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(tt); tt = setTimeout(function () { t.classList.remove("on"); }, 2600);
  };

  /* --- 히어로 제목 줄 단위 올라오기 준비 --- */
  var ht = doc.querySelector(".hero-title");
  if (ht && !ht.querySelector("span")) { var s = doc.createElement("span"); s.textContent = ht.textContent; ht.textContent = ""; ht.appendChild(s); }

  /* --- 인트로 (세션에 한 번만) --- */
  function ready() { body.classList.add("ready"); }
  var seen = safe(function () { return sessionStorage.getItem("intro"); });
  if (reduce || seen) { ready(); }
  else {
    var intro = doc.createElement("div");
    intro.className = "intro";
    intro.innerHTML = '<div class="intro-in"><b></b><span>SOLO FOUNDER ARCHIVE</span></div>';
    intro.querySelector("b").textContent = S.name;
    body.appendChild(intro);
    body.style.overflow = "hidden";
    safe(function () { sessionStorage.setItem("intro", "1"); });
    setTimeout(function () { intro.classList.add("out"); ready(); }, 1500);
    setTimeout(function () { intro.remove(); body.style.overflow = ""; }, 2700);
  }

  /* --- 키워드 띠 --- */
  var words = window.CATS.map(function (c) { return c.key; }).concat(["워크시트", "계산표", "체크리스트", "문장 모음", "달력"]);
  var row = words.map(function (w) { return "<span>" + w + "</span><i>/</i>"; }).join("");
  $("marq").innerHTML = row + row;

  /* --- 떠오르는 효과 --- */
  var targets = doc.querySelectorAll(".phil-in,.sec-head,.filters,.picks li,.op-note,.finder,.req li,.next,.about p,.news-in");
  var obs = "IntersectionObserver" in window && !reduce ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }) : null;
  Array.prototype.forEach.call(targets, function (el, i) {
    if (!obs) { el.classList.add("in"); return; }
    el.classList.add("rv");
    el.style.setProperty("--d", ((i % 5) * 0.06) + "s");
    obs.observe(el);
  });

  /* --- 숫자 올라가기 --- */
  function count(el) {
    var end = parseInt(el.textContent, 10);
    if (!/^\d+$/.test(el.textContent) || reduce) return;
    var t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 900, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = "0";
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { count(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    ["statCount", "statCats"].forEach(function (id) { co.observe($(id)); });
  }

  /* --- 스크롤: 진행 바, 맨 위로, 상단바, 현재 위치 --- */
  var bar = $("progress"), topBtn = $("toTop"), top = doc.querySelector(".top");
  var links = Array.prototype.slice.call(doc.querySelectorAll(".nav a"));
  var secs = links.map(function (a) { return doc.querySelector(a.getAttribute("href")); });
  var ticking = false;
  function onScroll() {
    var y = window.scrollY, h = doc.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    topBtn.classList.toggle("on", y > 600);
    top.classList.toggle("stuck", y > 8);
    var cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) cur = i; });
    links.forEach(function (a, i) { if (i === cur) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  topBtn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  onScroll();

  /* --- 이용약관 / 개인정보처리방침 --- */
  var mail = S.contact ? S.contact : "운영자에게 직접 문의해 주세요";
  var LEGAL = {
    terms: {
      title: "이용약관",
      html:
        '<p class="upd">2026.11.24 시행</p>' +
        '<h4>1. 자료 사용</h4><p>이 사이트의 자료는 본인의 사업이나 업무에 쓰는 용도로 자유롭게 쓰셔도 돼요. 출력해서 쓰고, 내 상황에 맞게 고쳐 쓰셔도 괜찮아요.</p>' +
        '<h4>2. 하지 말아 주세요</h4><ul><li>자료를 그대로 또는 일부만 바꿔서 다시 올리거나 판매하는 일</li><li>자료에 있는 시므온의 이름을 지우고 내 자료인 것처럼 쓰는 일</li></ul>' +
        '<h4>3. 책임의 범위</h4><p>자료는 참고용이에요. 세금, 법률, 회계에 관한 내용은 전문가의 상담을 대신하지 않아요. 날짜와 기준은 바뀔 수 있으니 중요한 결정 전에는 국세청이나 세무사, 해당 기관에서 확인해 주세요. 자료를 쓰다 생긴 손해에 대해 운영자는 책임지지 않아요.</p>' +
        '<h4>4. 자료의 변경</h4><p>자료는 예고 없이 고치거나 내릴 수 있어요. 고친 내용은 개정 횟수에 표시해요.</p>' +
        '<h4>5. 문의</h4><p>' + mail + '</p>'
    },
    privacy: {
      title: "개인정보처리방침",
      html:
        '<p class="upd">2026.11.24 시행</p>' +
        '<h4>1. 받는 정보</h4><p>일부 자료를 받기 전에 남기는 한 줄 답변만 받아요. 이름, 이메일, 전화번호는 이 사이트가 받지 않아요. 답변에 개인 정보나 고객 정보는 적지 말아 주세요.</p>' +
        '<h4>2. 쓰는 곳</h4><p>다음 자료를 만들 때 어떤 상황이 많은지 보는 용도로만 써요. 다른 곳에 팔거나 넘기지 않아요.</p>' +
        '<h4>3. 보관</h4><p>' + (S.answerEndpoint ? "남겨 주신 답변은 운영자가 연결한 폼 서비스에 저장되고, 삭제를 요청하시면 지워요." : "현재 남겨 주신 답변은 쓰시는 브라우저 안에만 저장돼요. 브라우저 기록을 지우면 함께 지워져요.") + ' 요청함의 공감 표시도 브라우저 안에만 저장돼요.</p>' +
        '<h4>4. 외부 서비스</h4><p>뉴스레터 구독과 자료 요청은 외부 서비스(구독 서비스, 폼 서비스)에서 처리해요. 이때 입력하시는 정보는 해당 서비스의 방침을 따라요. 이 사이트는 글꼴을 불러오기 위해 jsDelivr와 Google Fonts에 접속해요.</p>' +
        '<h4>5. 삭제와 문의</h4><p>남기신 답변을 지우고 싶으시면 아래로 연락해 주세요. 지울 수 있는 만큼 바로 지워요.</p><p>' + mail + '</p>'
    }
  };
  var modal = $("legal");
  function openLegal(k) {
    $("lTitle").textContent = LEGAL[k].title;
    $("lBody").innerHTML = LEGAL[k].html;
    modal.hidden = false;
  }
  doc.addEventListener("click", function (e) {
    var b = e.target.closest("[data-legal]");
    if (b) { openLegal(b.getAttribute("data-legal")); return; }
    if (e.target.closest("[data-lclose]")) modal.hidden = true;
  });
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape") modal.hidden = true; });
})();
