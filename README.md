# ISO 50001 能源管理系統 自我測驗

首頁提供兩個測驗：
1. **條文架構測驗**（`index.html`）：從 100 題題庫每次隨機抽 25 題，作答完才公布分數與錯誤說明
2. **內部稽核模擬測驗**（`audit.html`）：選擇負責項目 → 文件審查 → 模擬訪談 → 情境測驗 → 分項成績

## 檔案說明
| 檔案 | 內容 |
| --- | --- |
| `index.html` | 首頁與條文測驗入口 |
| `app.js` | 首頁與條文測驗程式（一般不需修改） |
| `style.css` | 首頁與條文測驗樣式 |
| `audit.html` | 內部稽核模擬測驗頁面與樣式 |
| `audit.js` | 稽核模擬流程程式（一般不需修改） |
| `data/site.js` | 網站標題、頁尾聲明、成績評語 |
| `data/clause-bank.js` | 條文測驗題庫（100 題） |
| `data/clauses.js` | 條文測驗設定：抽題數、每章最少題數、作答方式 |
| `data/audit-sim.js` | 稽核模擬全部內容：負責項目、模擬公司、文件、訪談、題目 |

## 發布到 GitHub Pages
1. 建立新的 Public repository，上傳所有檔案（保留 `data` 資料夾結構）
2. Settings → Pages，Branch 選 `main`、資料夾選 `/ (root)`，按 Save
3. 等一兩分鐘後取得網址，格式為 `https://帳號.github.io/儲存庫名稱/`

## 常見調整
- 改抽題數：`data/clauses.js` 的 `questionCount`
- 改成每題立即顯示對錯：`data/clauses.js` 的 `feedbackMode` 改為 `"instant"`
- 新增稽核題目：在 `data/audit-sim.js` 的 `questions` 加一組，`category` 對應負責項目 id
- 新增負責項目：在 `responsibilities`、`documents`、`interviews`、`questions` 四處都補上同一個 id
