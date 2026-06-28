# CampClient 前端開發進度

> 這份文件給「換電腦時的新 Claude Code 對話」或自己回顧用。
> 開新對話時說：
> 「前端進度在 C:\Users\User\Desktop\CampClient\CampClient\PROGRESS.md，後端文件在
> C:\Users\User\slnCampApi\slnCampApi\API_REFERENCE.md 和 PROGRESS.md，請先讀這些，我們接著做 [某個功能]」
>
> **注意：後端專案路徑是 `C:\Users\User\slnCampApi\slnCampApi\`（有兩層 slnCampApi），前端是 `C:\Users\User\Desktop\CampClient\CampClient\`**
>
> **⚠️ 這份文件容易跟實際進度脫節，尤其是「正在進行中」的功能。每次回來繼續做之前，先用 Glob/Read 確認程式碼實際內容，不要只信這份文件的文字描述。**

## 專案背景
- C2C 露營訂位平台前端，Angular 21 + PrimeNG v21（Aura 主題，綠色系自訂 `CampPreset`）
- 後端 API 文件：`C:\Users\User\slnCampApi\slnCampApi\API_REFERENCE.md`
- 後端開發進度：`C:\Users\User\slnCampApi\slnCampApi\PROGRESS.md`

## Angular / PrimeNG 語法注意事項（已踩過的坑）

- **`*ngIf` / `*ngFor` 已棄用**，全面改為 `@if` / `@for`（`@for` 必須有 `track`）
- **`CommonModule` 不要 import**，改個別 import 需要的（`NgClass`、`DecimalPipe` 從 `@angular/common`）
- **PrimeNG v21 改名**：`primeng/overlaypanel` → `primeng/popover`，`p-overlaypanel` → `p-popover`，`styleClass` → `class`
- **`p-skeleton`** 是 PrimeNG 元件，`styleClass` 屬性已棄用，改用 `class`
- **`[routerLink]="['/path', id]"`**：陣列寫法才能帶動態參數；純字串用 `routerLink="/path"` 即可
- **template reference `#name`**：只是局部變數名，同一頁多個 `ng-template` 可以都叫 `#item`，不衝突

## 已完成基礎架構

- `src/environments/environment.ts`：統一放 API base URL（`https://localhost:7011/api`）
- `src/app/interfaces/camp.interface.ts`：Phase 1–7 所有後端 DTO 對應的 TypeScript interface
- `src/app/services/`：
  - `exploration.service.ts`（首頁/探索）
  - `search.service.ts`（搜尋/地圖）含 `getOptions()`
  - `camp-detail.service.ts`（營區詳細頁）
  - `attraction.service.ts`（景點詳細頁）
  - `calendar.service.ts`（甘特圖/選位）
  - `camp-selection.service.ts`（**新增**：管理甘特圖選位狀態，跨 `gantt-calendar`/`zone-detail` 共用，見下方說明）
  - `checkout.service.ts`（結帳，含 `redirectToPayment()`，**尚未在畫面上使用**）
  - `payment.service.ts`（付款狀態/退款，**尚未在畫面上使用**）
  - `owner-wallet.service.ts`（營主錢包，**尚未在畫面上使用**）
  - `equipment-rental.service.ts` / `equipment-cart.service.ts`（裝備出租，同仁負責）
- `src/app/shared/map-icons.ts`：Leaflet 用的 SVG 圖示字串常數（`TENT_ICON_SVG`、`HOME_ICON_SVG`），多個地圖元件共用

## 路由總覽（`app.routes.ts`，務必以這份為準，文字描述常常漏項）

```
/                              首頁
/search                        搜尋/地圖
/camp/:id                      營區詳細頁（含甘特圖第一層）
/camp/:id/zone/:zoneId         Zone 細節頁（甘特圖第二層，骨架階段）
/camp/:id/rental                裝備出租（同仁）
/camp/:id/rental/equipment/:productId  裝備明細（同仁）
/attraction/:id                景點詳細頁
/checkout                      結帳（空殼，未實作）
/payment/result                付款結果（空殼，未實作）
/review, /review/add           評論（同仁）
/forum, /post, /post/:id       論壇（同仁）
/member-center (+children: orders, memberEdit, 預設 profile)   會員中心（同仁，有 authGuard）
/ownerCenter                   營主中心（同仁，有 authGuard，目前是空殼）
/register, /login, /owner-register   會員註冊登入（同仁）
```

## 共用元件

- `src/app/component/shared/nearby-camp-card/`：附近營區卡片（`app-nearby-camp-card`）
  - `@Input() camp: NearbyCampItem`，`@Output() cardEnter/cardLeave`（hover 連動地圖 popup）
  - 使用場景：camp-detail 附近其他營區、attraction-detail 順遊推薦

- `src/app/component/shared/lightbox/`：全螢幕照片瀏覽（`app-lightbox`）
  - `[(visible)]`、`[(activeIndex)]` 雙向綁定
  - **Why 自製**：PrimeNG 21 Galleria fullscreen portal 在 Angular zone 外渲染，prev/next 無法觸發 change detection，永久棄用 p-galleria
  - 使用場景：camp-detail、attraction-detail 照片格宮，**也被 gantt-calendar 的 INFO 彈窗重用**

- `src/app/component/shared/camp-card/`：營區卡片（`app-camp-card`）
  - `@Input() camp!: CampSearchResultDto`，`@Input() layout: 'vertical' | 'horizontal'`
  - 多圖切換、愛心收藏（僅前端切換，未串 API）、星評、highlights、tags
  - 首頁（horizontal 橫向捲動）和搜尋結果頁共用

- `src/app/component/shared/search-bar/`：搜尋列（`app-search-bar`）
  - 首頁（浮動大尺寸）與搜尋頁（`[compact]="true"`）共用同一元件
  - 客人面板動態載入 `GET /api/Search/options`，依 category 分自帶/免裝備兩區

- `src/app/component/shared/search-filters/`：篩選彈窗，套用才寫回網址

## Roadmap 進度

### ✅ Phase F1：基礎架構 — 完成
### ✅ Phase F2：首頁 — 完成（`src/app/component/home/`）
- Banner 輪播 + 浮動搜尋列、熱門營區橫向捲動（Airbnb 風格）
- 後端 `Highlights` 欄位（`Campgrounds.Highlights nvarchar(500)`，JSON 陣列字串，手動 ALTER TABLE 加的，沒用 Migration）

### ✅ Phase F3：搜尋與地圖 — 完成（`src/app/component/search/`）
- 卡片清單（40%）+ Leaflet 地圖（60%）雙欄版面，地圖 markercluster 分群
- Query Params 全部用 `router.navigate(..., { queryParamsHandling: 'merge' })` 同步
- bbox 跟著地圖 `moveend` 事件同步查詢
- 詳細踩坑記錄（Leaflet 圖示 404、transform 衝突等）見 git log 或之前對話，這份文件不重複貼長段程式碼避免又跟實際 code 脫節

### ✅ Phase F4：營區詳細頁 — 完成（`src/app/component/camp-detail/camp-detail.ts`）
**頁面結構（由上到下）**：
1. 照片格宮 + Lightbox
2. 基本資訊（名稱/海拔/地址導航/電話/官網/標籤）
3. 雙欄（左：highlights + description；右：分區清單卡 + 注意事項）
4. **`<app-gantt-calendar>` 甘特圖選位**（見下方 F5，這是獨立子元件，不是 placeholder）
5. 周邊探索 Leaflet 地圖（10km，景點+附近營區雙圖層）
6. 附近自然景點 / 附近其他營區橫向卡片列
7. 評論區（`<app-review>`，同仁元件）

### ✅ Phase F4b：景點詳細頁 — 完成（`src/app/component/attraction-detail/`）
結構同 F4 縮減版，地圖含景點主標記 + 附近營區。

---

### 🟡 Phase F5：甘特圖選位 — 進行中（分兩層，第一層完成、第二層待做）

**架構說明**：不是獨立頁面，`camp-detail.html` 裡引用 `<app-gantt-calendar>` 子元件（`src/app/component/camp-detail/gantt-calendar/`）。

#### ✅ 第一層：`gantt-calendar` 元件 — 已完成
檔案：`src/app/component/camp-detail/gantt-calendar/gantt-calendar.ts`

已實作功能：
- 拖拉選取日期格子（`onCellMouseDown` / `onCellMouseEnter` / 全域 `mouseup`）
- 同列重疊/緊接選位自動合併成一筆連續區間（`addOrMergeSelection`）
- Prev/Next 10 天視窗切換（`prevWindow`/`nextWindow`），`jumpToDate()` 供外部呼叫跳轉
- 右側 Zone 地圖（Leaflet + GeoJSON，衛星空拍底圖 Esri）：
  - 選位狀態即時連動變色（藍→黃）、permanent tooltip 顯示已選格數
  - hover 整片亮起 + 邊框加粗
  - 點 Zone 色塊 → `router.navigate(['/camp', campgroundId, 'zone', zoneId])` 進入第二層
- INFO 彈窗（`openInfo`）：打 `GET /api/Calendar/zone/{zoneId}/detail`，價格資料直接從父層傳入的 `zones`（`CampMapZoneDto`）取，不重複打 API
- 計算金額：`POST /api/Calendar/summary`，結果存 `orderSummary`
- **跨元件選位狀態管理**：新增 `src/app/services/camp-selection.service.ts`（`CampSelectionService`），用 RxJS 管理選位清單，`gantt-calendar` 訂閱顯示、之後 `zone-detail` 完成後也會用這個 service 把選位寫回來

#### ⬜ 第二層：`zone-detail` 元件 — 骨架階段，下一步要做這個
檔案：`src/app/component/camp-detail/zone-detail/zone-detail.ts`

目前狀態（程式碼裡的註解原文）：
> 骨架階段：先確保 `/camp/:id/zone/:zoneId` 能正常導航、撈到資料。Generic 月曆+數量選擇 / UniqueUnit 卡片多選，下一步再實作。

已完成：
- 路由參數解析（`campgroundId`、`zoneId`）
- 打 `GET /api/Calendar/zone/{zoneId}/calendar` 拿到 `CampZoneCalendarDto`
- `back()` 返回上一層

**還沒做（下一步具體任務）**：
- `calendar.zoneType === 1`（Generic）：月曆 UI + 數量選擇器，後端自動分配帳位
- `calendar.zoneType === 2`（UniqueUnit）：`calendar.units` 卡片列表，使用者自選一張或多張
- 確認後要呼叫 `POST /api/Calendar/zone/summary?type=generic|unit`（`calendar.service.ts` 裡的 `getZoneSummary()` 已經寫好，等著被呼叫）
- 選完要把結果寫進 `CampSelectionService`，然後 `router.navigate(['/camp', campgroundId])` 回到第一層，甘特圖要能正確反映新增的選位（可能需要呼叫 `gantt-calendar` 的 `jumpToDate()` 或重新整理選位）

---

### ⬜ Phase F6：結帳流程 — 未開始
- `src/app/component/checkout/checkout.ts` 目前是 `ng generate` 生成的空殼，沒有任何邏輯
- `checkout.service.ts` 已經寫好（`getSummary()`、`submit()`、`redirectToPayment()`），等著被呼叫
- 入口應該是 F5 甘特圖選完按「送出訂單」，把 `CampSelectionService` 的選位帶到這頁

### ⬜ Phase F7：付款確認/退款 — 未開始
- `src/app/component/payment-result/payment-result.ts` 同樣是空殼
- `payment.service.ts` 已寫好（`getStatus()`、`calculateRefund()`、`submitRefund()`）

### ⬜ Phase F8：營主後台/錢包 — 未開始
- `/ownerCenter` 路由存在（`src/app/component/member/owner-center/owner-center.ts`），但目前是空殼，可能同仁有規劃要放會員管理功能，**錢包功能還沒人接**
- `owner-wallet.service.ts` 已寫好（`getWallet()`、`withdraw()`）

## JWT 認證機制

- 登入成功後端回 token → 前端存 `localStorage`
- **HTTP Interceptor 由同仁完成**：`src/app/component/member/Service/interceptor.ts`，在 `app.config.ts` 註冊，自動幫所有 `HttpClient` 請求帶 `Authorization` header，**不要重複建立**
- `src/app/component/member/Service/authguard.ts`：路由守衛，`member-center`、`owner-register`、`ownerCenter` 都掛了 `canActivate: [authGuard]`

## 同仁負責的功能（不要亂動，除非對方請你協助）
- `component/reviews/`：評論功能
- `component/forum/`：論壇（含 `add-post`、`post/:id`）
- `component/member/`：會員登入/註冊/會員中心/營主中心框架，`MemberService` + `interceptor.ts` + `authguard.ts`
- `component/camping-rental/`（+ `equipment-detail/`）：裝備出租頁，`equipment-rental.service.ts` / `equipment-cart.service.ts`

## 測試資料
- 資料庫已手動建立 3 個測試營區（Id 1-3）+ 對應 Zone/Campsite/Pricing/Tags/Facilities/CampMedia
- `Highlights` 欄位是手動 `ALTER TABLE` 加的，**不在 EF Migration 裡**，換資料庫環境要記得重新跑
