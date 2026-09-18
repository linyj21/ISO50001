// ============================================
// 主程式：頁面切換、抽題、作答、結果
// 一般修改題目與文字時不需要動這個檔案
// ============================================
(function () {
  const app = document.getElementById("app");
  const STORE_KEY = "iso50001-progress-v1";

  // ---------- 工具 ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function commentFor(points) {
    const found = SITE.comments.find(c => points >= c.min);
    return found ? found.text : "";
  }

  // 章節分類：優先使用 chapter 欄位；否則取 clause 開頭數字；跨章題目歸為「綜合」
  function chapterOf(q) {
    if (q.chapter != null) return String(q.chapter);
    const clause = String(q.clause || "");
    if (/[～~]/.test(clause)) return "綜合";
    const m = clause.match(/^(\d+)/);
    return m ? m[1] : "綜合";
  }

  function clauseText(q) {
    if (!q.clause) return "";
    return q.clauseName ? q.clause + " " + q.clauseName : q.clause;
  }

  // ---------- 練習紀錄（只存在作答者自己的瀏覽器） ----------
  function loadProgress() {
    if (!SITE.rememberProgress) return {};
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveProgress(key, points) {
    if (!SITE.rememberProgress) return;
    try {
      const all = loadProgress();
      const prev = all[key] || { best: 0, attempts: 0 };
      all[key] = { best: Math.max(prev.best, points), attempts: prev.attempts + 1 };
      localStorage.setItem(STORE_KEY, JSON.stringify(all));
    } catch (e) { /* 瀏覽器不允許儲存時略過 */ }
  }

  function statusHTML(key) {
    if (!SITE.rememberProgress) return "";
    const p = loadProgress()[key];
    if (!p) return `<div class="status">尚未練習</div>`;
    return `<div class="status done">已練習 ${p.attempts} 次，最佳 ${p.best} 分</div>`;
  }

  // ---------- 頁面：首頁 ----------
  function showHome() {
    document.title = SITE.title;
    const clauseCount = Math.min(CLAUSE_QUIZ.questionCount, CLAUSE_QUIZ.bank.length);

    app.innerHTML = `
      <header class="site-head">
        <h1>${esc(SITE.title)}</h1>
        <p class="lead">${esc(SITE.intro)}</p>
      </header>

      <div class="choices">
        <a class="card" href="#/clauses">
          <h2>${esc(CLAUSE_QUIZ.title)}</h2>
          <p>${esc(CLAUSE_QUIZ.description)}</p>
          <ul class="meta">
            <li><span>適合對象</span>${esc(CLAUSE_QUIZ.audience)}</li>
            <li><span>出題方式</span>從 ${CLAUSE_QUIZ.bank.length} 題中隨機抽 ${clauseCount} 題</li>
          </ul>
          ${statusHTML("clauses")}
          <span class="btn">開始測驗</span>
        </a>

        <a class="card" href="audit.html">
          <h2>${esc(AUDIT_SIM.title)}</h2>
          <p>${esc(AUDIT_SIM.description)}</p>
          <ul class="meta">
            <li><span>適合對象</span>${esc(AUDIT_SIM.audience)}</li>
            <li><span>出題方式</span>依負責項目出題，共 ${AUDIT_SIM.responsibilities.length} 個項目 ${AUDIT_SIM.questions.length} 題</li>
          </ul>
          <div class="status">模擬文件審查、訪談與情境判斷</div>
          <span class="btn">開始模擬</span>
        </a>
      </div>

      <footer class="site-foot">${esc(SITE.footer)}</footer>`;
  }

  // ---------- 頁面：條文架構測驗說明 ----------
  function showClauseIntro() {
    document.title = CLAUSE_QUIZ.title + "｜" + SITE.title;
    const count = Math.min(CLAUSE_QUIZ.questionCount, CLAUSE_QUIZ.bank.length);
    const groups = new Set(CLAUSE_QUIZ.bank.map(chapterOf)).size;
    const quotaText = CLAUSE_QUIZ.minPerChapter > 0
      ? `每個章節至少 ${CLAUSE_QUIZ.minPerChapter} 題，其餘隨機`
      : "完全隨機";
    const modeText = CLAUSE_QUIZ.feedbackMode === "end"
      ? "作答過程不顯示對錯，全部完成後公布分數與錯誤說明"
      : "每題作答後立即顯示對錯與說明";

    app.innerHTML = `
      <a class="back" href="#/">← 回首頁</a>
      <div class="panel">
        <h1>${esc(CLAUSE_QUIZ.title)}</h1>
        <p>${esc(CLAUSE_QUIZ.description)}</p>
        <ul class="meta">
          <li><span>題庫</span>共 ${CLAUSE_QUIZ.bank.length} 題，分為 ${groups} 個章節分類</li>
          <li><span>本次題數</span>${count} 題，滿分 100 分</li>
          <li><span>抽題方式</span>${quotaText}</li>
          <li><span>作答方式</span>${modeText}</li>
        </ul>
        ${statusHTML("clauses")}
        <div class="actions"><button class="btn" id="start">開始作答</button></div>
      </div>`;

    document.getElementById("start").onclick = startClauseQuiz;
  }

  function pickClauseQuestions() {
    const bank = CLAUSE_QUIZ.bank;
    const count = Math.min(CLAUSE_QUIZ.questionCount, bank.length);
    let picked = [];

    if (CLAUSE_QUIZ.minPerChapter > 0) {
      const groups = {};
      bank.forEach(q => {
        const ch = chapterOf(q);
        if (!groups[ch]) groups[ch] = [];
        groups[ch].push(q);
      });
      shuffle(Object.keys(groups)).forEach(ch => {
        shuffle(groups[ch]).slice(0, CLAUSE_QUIZ.minPerChapter).forEach(q => {
          if (picked.length < count) picked.push(q);
        });
      });
    }

    const rest = shuffle(bank.filter(q => !picked.includes(q)));
    picked = picked.concat(rest.slice(0, count - picked.length));
    return shuffle(picked);
  }

  function startClauseQuiz() {
    runQuiz({
      label: CLAUSE_QUIZ.title,
      questions: pickClauseQuestions(),
      shuffleOptions: CLAUSE_QUIZ.shuffleOptions,
      feedbackMode: CLAUSE_QUIZ.feedbackMode,
      exitHash: "#/clauses",
      storeKey: "clauses",
      retryText: "重新抽題測驗",
      onRetry: startClauseQuiz,
      afterLinks: `<a class="btn secondary" href="#/">回首頁</a>`
    });
  }

  // ---------- 共用：作答流程 ----------
  function runQuiz(cfg) {
    const instant = cfg.feedbackMode !== "end";

    const qs = cfg.questions.map(q => {
      let opts = q.options.map((text, i) => ({ text, correct: i === q.answer }));
      // 含「以上皆是／以上皆非」的題目保持原順序
      const hasAbove = q.options.some(t => /^以上/.test(t));
      if (cfg.shuffleOptions && !hasAbove) opts = shuffle(opts);
      return Object.assign({}, q, { opts });
    });

    let current = 0;
    const picks = []; // 每題：{ index, text, right }

    function renderQuestion() {
      const q = qs[current];
      const isLast = current === qs.length - 1;

      app.innerHTML = `
        <div class="panel">
          <div class="quiz-top">
            <a class="back" href="${cfg.exitHash}" id="exit">← 離開測驗</a>
            <span>${esc(cfg.label)}</span>
          </div>
          <div class="progress"><div class="progress-bar" id="bar"></div></div>
          <div class="count-line">第 ${current + 1} 題 / 共 ${qs.length} 題</div>
          ${q.scenario ? `<div class="scenario"><span class="scenario-label">情境</span>${esc(q.scenario)}</div>` : ""}
          <p class="question">${esc(q.question)}</p>
          <div class="options" role="group">
            ${q.opts.map((o, i) => `<button class="option" data-i="${i}">${esc(o.text)}</button>`).join("")}
          </div>
          <div id="feedback"></div>
          <div class="actions"><button class="btn" id="next" hidden>${isLast ? (instant ? "看結果" : "交卷看成績") : "下一題"}</button></div>
        </div>`;

      requestAnimationFrame(() => {
        document.getElementById("bar").style.width = (current / qs.length * 100) + "%";
      });

      document.getElementById("exit").onclick = e => {
        if (current > 0 || picks[current]) {
          if (!confirm("確定要離開嗎？這次作答不會保留。")) e.preventDefault();
        }
      };

      app.querySelectorAll(".option").forEach(btn => {
        btn.onclick = () => choose(Number(btn.dataset.i));
      });

      document.getElementById("next").onclick = () => {
        current++;
        if (current < qs.length) renderQuestion();
        else renderResult();
        window.scrollTo(0, 0);
      };
    }

    function choose(i) {
      const q = qs[current];
      const buttons = app.querySelectorAll(".option");
      picks[current] = { index: i, text: q.opts[i].text, right: q.opts[i].correct };
      const next = document.getElementById("next");

      if (!instant) {
        // 考試模式：只標示選擇，可在按下一題前更改
        buttons.forEach((b, idx) => b.classList.toggle("selected", idx === i));
        next.hidden = false;
        return;
      }

      const right = q.opts[i].correct;
      const correctText = q.opts.find(o => o.correct).text;
      buttons.forEach((b, idx) => {
        b.disabled = true;
        if (q.opts[idx].correct) b.classList.add("correct");
        else if (idx === i) b.classList.add("wrong");
      });

      document.getElementById("feedback").innerHTML = `
        <div class="feedback">
          <strong class="${right ? "ok" : "ng"}">${right ? "答對了" : "答錯了，正確答案是「" + esc(correctText) + "」"}</strong>
          ${esc(q.explanation)}
          ${q.clause ? `<p class="clause">相關條文：${esc(clauseText(q))}</p>` : ""}
        </div>`;

      next.hidden = false;
      next.focus();
    }

    function renderResult() {
      const total = qs.length;
      const correct = picks.filter(p => p.right).length;
      const wrongCount = total - correct;
      const points = Math.round(correct / total * 100);
      saveProgress(cfg.storeKey, points);

      const wrongItems = qs
        .map((q, idx) => ({ q, idx, p: picks[idx] }))
        .filter(x => !x.p.right);

      const wrongHTML = wrongItems.length === 0
        ? `<p class="all-right">全部答對，沒有錯誤題目。</p>`
        : `<ol class="wrong-list">
            ${wrongItems.map(({ q, idx, p }) => {
              const correctText = q.opts.find(o => o.correct).text;
              return `<li class="wrong-item">
                <div class="wrong-no">第 ${idx + 1} 題${q.clause ? `<span>${esc(clauseText(q))}</span>` : ""}</div>
                ${q.scenario ? `<p class="wrong-scenario">${esc(q.scenario)}</p>` : ""}
                <p class="wrong-q">${esc(q.question)}</p>
                <dl class="answers">
                  <div><dt>你的答案</dt><dd class="ng">${esc(p.text)}</dd></div>
                  <div><dt>正確答案</dt><dd class="ok">${esc(correctText)}</dd></div>
                </dl>
                <p class="explain"><strong>說明</strong>${esc(q.explanation)}</p>
              </li>`;
            }).join("")}
          </ol>`;

      app.innerHTML = `
        <div class="panel">
          <div class="progress"><div class="progress-bar" style="width:100%"></div></div>
          <h1 style="margin-top:20px">${esc(cfg.label)}：測驗結果</h1>
          <div class="score">${points}<small>分</small></div>
          <p class="tally">答對 <b class="ok">${correct}</b> 題，答錯 <b class="ng">${wrongCount}</b> 題，共 ${total} 題</p>
          <p>${esc(commentFor(points))}</p>
          <div class="actions">
            <button class="btn" id="retry">${esc(cfg.retryText)}</button>
            ${cfg.afterLinks}
          </div>
        </div>

        <section class="panel result-section">
          <h2>錯誤題目說明${wrongItems.length ? `（${wrongItems.length} 題）` : ""}</h2>
          ${wrongHTML}
        </section>

        <section class="panel result-section">
          <details>
            <summary>查看全部 ${total} 題作答情形</summary>
            <ul class="review">
              ${qs.map((q, idx) => {
                const p = picks[idx];
                return `<li>
                  <span class="mark ${p.right ? "ok" : "ng"}">${p.right ? "✓" : "✗"}</span>${idx + 1}. ${esc(q.question)}
                  <span class="detail">正確答案：${esc(q.opts.find(o => o.correct).text)}${q.clause ? "｜" + esc(clauseText(q)) : ""}</span>
                </li>`;
              }).join("")}
            </ul>
          </details>
        </section>`;

      document.getElementById("retry").onclick = () => { cfg.onRetry(); window.scrollTo(0, 0); };
    }

    renderQuestion();
  }

  // ---------- 網址切換 ----------
  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    if (parts[0] === "clauses") showClauseIntro();
    else if (parts[0] === "audit") location.replace("audit.html");
    else showHome();
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  route();
})();
