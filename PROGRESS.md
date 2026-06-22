# CampClient 前端開發進度

> 這份文件給「換電腦時的新 Claude Code 對話」或自己回顧用。
> 開新對話時可以說：「前端進度在 PROGRESS.md，後端文件在 C:\Users\ChiSiou\slnCampApi\API_REFERENCE.md
> 和 PROGRESS.md，請先讀這些，我們接著做 [某個功能]」

## 專案背景
- C2C 露營訂位平台前端，Angular + PrimeNG（Aura 主題，綠色系自訂 `CampPreset`）
- 後端 API 文件：`C:\Users\ChiSiou\slnCampApi\API_REFERENCE.md`
- 後端開發進度：`C:\Users\ChiSiou\slnCampApi\PROGRESS.md`

## 已完成基礎架構

- `src/environments/environment.ts`：統一放 API base URL（`https://localhost:7011/api`）
- `src/app/interfaces/camp.interface.ts`：Phase 1–7 所有後端 DTO 對應的 TypeScript interface
- `src/app/services/`：對應後端七個 Phase 各一個 service
  - `exploration.service.ts`（首頁/探索）
  - `search.service.ts`（搜尋/地圖）
  - `camp-detail.service.ts`（營區詳細頁）
  - `calendar.service.ts`（甘特圖/選位）
  - `checkout.service.ts`（結帳，含 `redirectToPayment()` 自動建表單送綠界）
  - `payment.service.ts`（付款狀態/退款）
  - `owner-wallet.service.ts`（營主錢包）
- `app.routes.ts`：已加上 `/search`、`/camp/:id`、`/checkout`、`/payment/result` 路由
  （對應元件已用 `ng generate component` 建立空殼，待填內容）

## 共用元件

- `src/app/component/shared/camp-card/`：營區卡片元件（`app-camp-card`）
  - 對齊後端 `CampSearchResultDto`：`id, name, area, basePrice, averageRating,
    reviewCount, latitude, longitude, isLiked, imageUrls, highlights, elevation, tags`
  - 功能：多圖切換（左右箭頭 + 點點）、愛心收藏按鈕（**目前只是前端切換狀態，
    沒有串 API，後端尚無 Favorite 資料表**）、星評、highlights bullet list、tags 標籤列
  - 首頁和之後的搜尋結果頁都共用這個元件，不要在頁面裡重複寫卡片 HTML

## Roadmap 進度

### ✅ Phase F1：基礎架構 —— 完成
見上方「已完成基礎架構」

### ✅ Phase F2：首頁 —— 完成
檔案：`src/app/component/home/`

- 已串接 `GET /api/Exploration/home`
- Banner 輪播（`p-carousel`），對應 `HomeFeedDto.Announcements`
  - 欄位對齊：`id, title, imageUrl, publishedDate, linkUrl`
- 熱門營區卡片（用共用 `app-camp-card` 元件），對應 `HomeFeedDto.FeaturedCamps`
- Loading 時顯示 `p-skeleton` 骨架畫面

**重要業務邏輯（換電腦容易忘記）**：
- 後端 `GetFeaturedCampsAsync` 排序邏輯是先抓「有評論的營區」再排序，
  **沒有評論的營區不會出現在首頁熱門清單**，測試時記得幫每個營區都補幾筆 Reviews
- `Highlights` 欄位：後端 `Campgrounds` 資料表手動加了 `Highlights nvarchar(500)` 欄位
  （**沒有用 EF Migration，是手動 ALTER TABLE**，換資料庫環境要記得重新跑一次）
  - 存 JSON 陣列字串，例如：`["距市區僅40分鐘","夜晚可見滿天星斗","提供薪柴免費使用"]`
  - `Campground.cs` Model 加了 `public string? Highlights { get; set; }`
  - `ExplorationService.cs` 的 `GetFeaturedCampsAsync` 改成
    `JsonSerializer.Deserialize<List<string>>(camp.Highlights)`，沒填就回空陣列，
    前端 `*ngIf="camp.highlights?.length"` 沒資料就不顯示該區塊
  - 沒填這個欄位時，卡片上 highlights 區塊會自動隱藏（不會顯示空白或重複 tags）

### ⬜ Phase F3：搜尋與地圖 —— 待開始
對應後端 Phase 2，service 已建好（`search.service.ts`），元件殼已建（`component/search/`）

- 搜尋列（關鍵字、地區、日期、人數）
- 篩選器（`GET /api/Search/filters` 環境/政策標籤 + 設施）
- 搜尋結果列表（`POST /api/Search`，分頁），**直接重用 `app-camp-card` 元件**
- 地圖模式（`POST /api/Search/map`，需要 Leaflet 或類似套件畫地圖+markers）

### ⬜ Phase F4：營區詳細頁 —— 待開始
對應後端 Phase 3，service 已建好（`camp-detail.service.ts`），元件殼已建（`component/camp-detail/`）

- 串 `GET /api/CampDetail/{id}`、`/location`、`/zones`
- 照片輪播、基本資訊、標籤
- Zone 互動地圖（GeoJSON，需要地圖套件）

### ⬜ Phase F5：日曆選位 —— 待開始（最複雜）
對應後端 Phase 4，service 已建好（`calendar.service.ts`）

- 左側甘特圖（10天 + Prev/Next）+ 右側 Zone 地圖雙向連動
- Zone INFO 彈窗
- 第二層：Generic 月曆選位 / UniqueUnit 卡片選位

### ⬜ Phase F6：結帳流程 —— 待開始
對應後端 Phase 5，service 已建好（`checkout.service.ts`），元件殼已建（`component/checkout/`）

- 訂單摘要頁、聯絡資料填寫
- 送出訂單後呼叫 `checkoutService.redirectToPayment()` 自動跳轉綠界

### ⬜ Phase F7：付款確認/退款 —— 待開始
對應後端 Phase 6，service 已建好（`payment.service.ts`），元件殼已建（`component/payment-result/`）

- 付款結果輪詢頁、退款試算/確認流程

### ⬜ Phase F8：營主後台 —— 待開始
對應後端 Phase 7，service 已建好（`owner-wallet.service.ts`）

- 錢包餘額、結算明細、申請提領

## 與本次無關但同仁負責的功能（不要混淆）
- `component/reviews/`：評論功能，已有 service 串 API（CRUD + 圖片上傳）
- `component/forum/`：論壇功能，service 目前是空的
- `component/member/`：會員登入/註冊，已完成，`MemberService` 處理 JWT
  - 注意 `islogin()` 目前會自動 `navigate()`，當判斷邏輯用容易有副作用，
    之後有空可以拆成 `isLoggedIn(): boolean` 純判斷 + `redirectIfNotLoggedIn()`

## 測試資料
資料庫已手動建立 3 個測試營區（Id 1-3）+ 對應 Zone/Campsite/Pricing/Tags/Facilities/
CampMedia，後端 Promotions/Reviews/HolidayDate/PlatformSettings 用資料庫原有資料。
