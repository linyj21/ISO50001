// ============================================
// 內部稽核模擬測驗：流程控制
// 內容請改 data/audit-sim.js，一般不需要修改本檔
// ============================================
let selectedResponsibilities = [];
let activeQuestions = [];

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function findResp(id) {
  return AUDIT_SIM.responsibilities.find(r => r.id === id);
}

function showPage(n) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("page" + n).classList.add("active");
  window.scrollTo(0, 0);
}

// ---------- 初始畫面 ----------
(function init() {
  document.getElementById("responsibilityList").innerHTML =
    AUDIT_SIM.responsibilities.map(r => `
      <label class="pick">
        <input type="checkbox" value="${esc(r.id)}">
        <strong>${esc(r.name)}</strong>
        <small>${esc(r.description)}</small>
        <span class="clause-tag">ISO 50001 ${esc(r.clauses)}</span>
      </label>`).join("");

  document.getElementById("companyName").textContent = AUDIT_SIM.company.name;
  document.getElementById("companyRows").innerHTML =
    AUDIT_SIM.company.rows.map(row => `<tr><td>${esc(row[0])}</td><td>${esc(row[1])}</td></tr>`).join("");
  document.getElementById("situation").textContent = AUDIT_SIM.company.situation;

  if (typeof SITE !== "undefined" && SITE.footer) {
    document.getElementById("footNote").textContent = SITE.footer;
  }
})();

// ---------- STEP 1 → 2 ----------
function startSimulation() {
  selectedResponsibilities = [...document.querySelectorAll('#responsibilityList input:checked')].map(x => x.value);

  if (selectedResponsibilities.length === 0) {
    alert("請至少選擇一項負責項目");
    return;
  }

  document.getElementById("selectedDisplay").innerHTML =
    selectedResponsibilities.map(id => `<span class="section-tag">${esc(findResp(id).name)}</span>`).join("");

  showPage(2);
}

// ---------- STEP 3 文件 ----------
function prepareDocuments() {
  const docs = selectedResponsibilities.map(id => AUDIT_SIM.documents[id]).filter(Boolean);
  document.getElementById("documentContainer").innerHTML = docs.map(doc => `
    <div class="doc">
      <div class="doc-title" onclick="this.parentElement.classList.toggle('open')">📄 ${esc(doc.title)}　（點選展開）</div>
      <div class="doc-content">${doc.content}</div>
    </div>`).join("");
  showPage(3);
}

// ---------- STEP 4 訪談 ----------
function prepareInterview() {
  document.getElementById("interviewContainer").innerHTML = selectedResponsibilities.map(id => {
    const data = AUDIT_SIM.interviews[id];
    if (!data) return "";
    return `<h3>${esc(findResp(id).name)}</h3>` + data.map(line => `
      <div class="dialogue ${line[0] === "稽核員" ? "auditor" : "employee"}">
        <strong>${esc(line[0])}：</strong>${esc(line[1])}
      </div>`).join("");
  }).join("");
  showPage(4);
}

// ---------- STEP 5 測驗 ----------
function prepareQuiz() {
  activeQuestions = AUDIT_SIM.questions.filter(q => selectedResponsibilities.includes(q.category));

  document.getElementById("quizContainer").innerHTML = selectedResponsibilities.map(category => {
    const list = activeQuestions.filter(q => q.category === category);
    if (list.length === 0) return "";
    return `<h3 style="margin-top:30px">${esc(findResp(category).name)}</h3>` + list.map(q => `
      <div class="q">
        <span class="clause-tag">ISO 50001 ${esc(q.clause)}</span>
        <h3>${esc(q.question)}</h3>
        ${q.options.map((option, index) => `
          <label class="option">
            <input type="radio" name="question_${q.id}" value="${index}">
            ${String.fromCharCode(65 + index)}. ${esc(option)}
          </label>`).join("")}
      </div>`).join("");
  }).join("");

  showPage(5);
}

// ---------- 送出 ----------
function submitQuiz() {
  const unanswered = activeQuestions.filter(q => !document.querySelector(`input[name="question_${q.id}"]:checked`)).length;
  if (unanswered > 0 && !confirm(`尚有 ${unanswered} 題未作答，未作答將以答錯計算，是否仍要送出？`)) return;
  calculateResults();
}

// ---------- STEP 6 結果 ----------
function calculateResults() {
  let correct = 0;
  const categoryData = {};
  selectedResponsibilities.forEach(id => { categoryData[id] = { total: 0, correct: 0 }; });

  const reviewHTML = activeQuestions.map((q, index) => {
    const selected = document.querySelector(`input[name="question_${q.id}"]:checked`);
    const userAnswer = selected ? Number(selected.value) : null;
    const isCorrect = userAnswer === q.answer;

    categoryData[q.category].total++;
    if (isCorrect) { correct++; categoryData[q.category].correct++; }

    return `
      <div class="review ${isCorrect ? "" : "wrong"}">
        <span class="section-tag">${esc(findResp(q.category).name)}</span>
        <span class="clause-tag">ISO 50001 ${esc(q.clause)}</span>
        <h3>第 ${index + 1} 題｜${isCorrect ? '<span class="ok-text">✓ 答對</span>' : '<span class="ng-text">✕ 答錯</span>'}</h3>
        <p><strong>${esc(q.question)}</strong></p>
        <p>您的答案：${userAnswer === null ? "未作答" : String.fromCharCode(65 + userAnswer) + ". " + esc(q.options[userAnswer])}</p>
        <p class="ok-text">正確答案：${String.fromCharCode(65 + q.answer)}. ${esc(q.options[q.answer])}</p>
        <p><strong>正解說明</strong><br>${esc(q.explanation)}</p>
        <div class="notice"><strong>實務稽核提醒</strong><br>${esc(q.practical)}</div>
      </div>`;
  }).join("");

  const total = activeQuestions.length;
  const score = total ? Math.round(correct / total * 100) : 0;

  let message = "建議重新檢視相關條文、程序文件及稽核查證邏輯後再次練習。";
  if (score >= 90) message = "對相關能源管理要求及稽核判斷已有良好掌握。";
  else if (score >= 70) message = "已具備基本概念，建議再檢視答錯項目的條文要求與稽核證據判斷。";

  document.getElementById("totalScore").textContent = score + " 分";
  document.getElementById("scoreMessage").innerHTML =
    `<p>答對 ${correct} / ${total} 題</p><p>${esc(message)}</p>`;

  document.getElementById("categoryScores").innerHTML = Object.keys(categoryData).map(id => {
    const d = categoryData[id];
    if (d.total === 0) return "";
    const percent = Math.round(d.correct / d.total * 100);
    return `
      <div class="cat-row">
        <strong>${esc(findResp(id).name)}</strong>
        <span class="num">${d.correct}/${d.total}（${percent}%）</span>
        <div class="progress"><div class="progress-bar" style="width:${percent}%"></div></div>
      </div>`;
  }).join("");

  document.getElementById("answerReview").innerHTML = reviewHTML;
  showPage(6);
}
