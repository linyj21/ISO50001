// ============================================
// 條文架構測驗：設定
// 題目本身放在 data/clause-bank.js
// ============================================
const CLAUSE_QUIZ = {
  title: "條文架構測驗",
  description: "確認是否了解 ISO 50001:2018 第 4 至 10 章的架構、重要名詞與各條文重點。",
  audience: "能源管理團隊成員",

  bank: iso50001Questions, // 題庫來源（data/clause-bank.js）

  questionCount: 25,     // 每次隨機抽出幾題
  minPerChapter: 1,      // 每個章節至少抽幾題，設為 0 代表完全隨機
  shuffleOptions: true,  // 打亂選項順序（含「以上皆是」的題目會自動保持原順序）

  // 作答回饋方式
  // "end"：作答過程不顯示對錯，全部答完才公布分數與錯誤說明
  // "instant"：每題作答後立即顯示對錯與說明
  feedbackMode: "end"
};
