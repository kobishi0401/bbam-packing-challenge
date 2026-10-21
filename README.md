# BBAM Packing Challenge｜出貨大挑戰

繁體中文、iPad 橫向優先的正式面試出貨測驗。React / TypeScript / Vinext（Next.js API）/ Cloudflare D1，透過 Sites 部署。


## 線上使用與權限

- 應徵者測驗：https://bbam-packing-challenge.kobishi.chatgpt.site/ （任何人可作答，不需 ChatGPT 登入）
- 面試官後台：https://bbam-packing-challenge.kobishi.chatgpt.site/admin （僅網站擁有者身分與管理密碼可讀取結果）
- GitHub 公開原始碼不授予正式網站管理權限，也不包含測驗個資、資料庫檔案、管理密碼或 Sites 環境變數。
- 目前 17 款商品、10 分鐘、6 筆固定訂單；襪子四款與髮圈三款皆為單一尺寸。提交時不揭露正誤；結束後可看自己的結果並直接開始新測驗。
- 固定題庫也在公開原始碼中，供檢視程式與測試；本工具適合現場觀察，不是保密題庫。
- 自行部署必須在自己的 Sites 伺服器設定秘密環境變數 ADMIN_OWNER_EMAIL；首次管理員設定只接受該帳號，既有登入還需正確密碼與身分。網站原則上維持 public。

## 第一次使用

1. 應徵者直接開啟測驗網址，不需登入；面試官使用網站擁有者的 ChatGPT 帳號進入 `/admin`。
2. 進入「面試官登入」，設定至少 12 個字元的管理密碼。密碼以隨機 salt + PBKDF2-SHA256（100,000 次）儲存，無預設密碼。
3. 按「開始新測驗」。系統鎖定管理區，再將 iPad 交給應徵者。
4. 應徵者輸入姓名開始。結束後面試官再次輸入管理密碼，查看結果及匯出。

Sites 公開存取，應徵者直接開啟網址即可操作，不需要 ChatGPT 帳號。首次管理員設定僅允許 ADMIN_OWNER_EMAIL 指定的網站擁有者；此值由 Sites 伺服器秘密環境變數保存。管理區另有伺服器密碼驗證，且必須為首次設定時綁定的 Sites 身分。Session 為 HttpOnly / SameSite=Strict cookie，正式 HTTPS 下有 Secure，30 分鐘到期。5 次登入失敗暫停 110 分鐘。開始測驗會撤銷本瀏覽器管理 Session。不要在應徵者面前設定或輸入密碼。

## 資料與計時

- 商品資料：`lib/catalog.ts`；固定訂單：`lib/orders.ts`（僅伺服器端匯入）。未啟動測驗的頁面不包含固定答案。
- 開始時伺服器建立 10 分鐘截止時間，候選人以隨機 256-bit capability token 存取自己的紀錄。資料庫僅儲存 token hash。
- 用牆鐘時間及單調時計算倒數；重新整理、背景切換不延長截止時間。
- 商品操作、客服草稿與已提交事件立即寫入 localStorage，約每 4 秒同步 D1；提交後亦立即同步。時間到由截止時間推導逾時，無需瀏覽器保持開啟。
- 離線可繼續當前測驗；所有必要訂單在已授權的測驗建立時提供裝置。恢復連線或再次開啟網站時同步。正式版 Service Worker 快取候選人頁面與程式資源，支援已載入完成之裝置離線重新整理；首次造訪、首次開始測驗與管理查詢仍需網路。
- 未同步時畫面明確標示待同步；完成畫面只有伺服器確認保存後才顯示「測驗結果已提交」。請勿在待同步期間清除 Safari 網站資料／使用私密瀏覽。Safari/作業系統仍可能清除長期未用網站儲存，未同步資料無法保證永久保留。
- 伺服器驗證事件順序、資料規格、截止時間與已保存前綴；已保存出貨不可覆寫。離線事件使用裝置記錄時間並標示延遲同步，不宣稱具備防竄改監考。離線提交尚未同步前，管理頁僅顯示資料庫已收到內容。
- 單筆訂單耗時：上一筆完成後至本筆提交；第三筆從第二次客服回覆提交後開始。客服耗時各自從訊息出現計算。總耗時包含客服。正確率分母固定 6，未完成不算正確。
- 商品差異以 ID/顏色/尺寸精確比對；只有唯一的一欄差異會標示款式、顏色或尺寸不符。多欄或多種可配對錯誤保留精確缺少／多出清單，避免假稱知道應徵者的替代意圖。
- CSV 包含 ISO 時間、毫秒耗時、原始及實際商品、差異 JSON、完整客服原文。CSV 針對試算表公式起始字元加單引號；TXT 匯出保留客服原文。
- 無 AI 呼叫、綜合評分、人格分析或錄取建議。

## 本機開發

需要 Node.js 22.13+。依 Sites 技能初始化及安裝後：

```sh
npm run db:generate
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_*.sql
npm run dev
```

請將 migration 檔名換成實際生成檔案，依序執行一次。開發環境 `/signin-with-chatgpt?return_to=/admin` 提供 starter 內建的 loopback 模擬身分；正式環境不含模擬登入。資料庫 schema 由 Drizzle migration 管理，不在 request 中建表。

```sh
node node_modules/typescript/bin/tsc --noEmit
node --test tests/engine.test.mjs
```

完整瀏覽器測試：先用 `npm start -- --port 8787` 啟動正式版的本機 Worker。安裝／指定 Playwright（環境變數 `BBAM_PLAYWRIGHT` 可設定套件絕對路徑），本機 Worker 須設定 `--var ADMIN_OWNER_EMAIL:qa@sites.test`，再執行 `node tests/browser.mjs`。測試會使用 8788 埠的本機斷線代理，並清空本專案的**本機測試資料庫**，請勿用於有保留需求的本機資料。它不連接正式站點。`PLAYWRIGHT_BROWSERS_PATH` 可指定既有瀏覽器目錄。測試報告見 `TESTING.md`。

## 部署

公開原始碼的 `.openai/hosting.json` 只保留 `d1: "DB"`。自行部署須建立自己的 Sites 專案，再填入自己的 project_id；不可沿用他人的 Site。Sites 會建立資料庫並套用 migration。不需要 Supabase、AI API key 或硬編碼密碼。按 Sites 標準流程先推送完全相符的來源 commit，再建置封裝及發佈版本。此專案使用 Cloudflare Worker 的 D1，不能原封不動當成 Vercel 專案部署。

管理密碼遺失：無公開重設後門。需由 Site 擁有者透過受保護資料庫維護重設 settings 與 admin_sessions；正式資料 tests 可保留。


新版為 17 款商品、漸進難度，完成後可查看自己的結果；舊版 8 分鐘紀錄保留原題目。

應徵者結束頁可直接按「開始新測驗」，不需管理員登入。按鈕在已同步後啟用，並再次確認伺服器保存及測驗結束；成功後只清除本機目前測驗與憑證，保留後台歷史紀錄。
