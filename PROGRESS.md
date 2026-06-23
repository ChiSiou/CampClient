# CampClient 前端開發進度

> 這份文件給「換電腦時的新 Claude Code 對話」或自己回顧用。
> 開新對話時可以說：「前端進度在 PROGRESS.md，後端文件在 C:\Users\User\slnCampApi\slnCampApi\API_REFERENCE.md
> 和 PROGRESS.md，請先讀這些，我們接著做 [某個功能]」
>
> **注意：後端專案路徑是 `C:\Users\User\slnCampApi\slnCampApi\`（有兩層 slnCampApi）**

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
- `src/app/interfaces/camp.interface.ts`：Phase 1–7 所有後端 DTO 對應的 TypeScript interface（**已完整對齊後端**，詳見下方「Interface 對齊記錄」）
- `src/app/services/`：對應後端七個 Phase 各一個 service
  - `exploration.service.ts`（首頁/探索）
  - `search.service.ts`（搜尋/地圖）含 `getOptions()` 撈 AccomType 選項
  - `camp-detail.service.ts`（營區詳細頁）
  - `calendar.service.ts`（甘特圖/選位）
  - `checkout.service.ts`（結帳，含 `redirectToPayment()` 自動建表單送綠界，已加 null check）
  - `payment.service.ts`（付款狀態/退款）
  - `owner-wallet.service.ts`（營主錢包）
- `app.routes.ts`：已加上 `/search`、`/camp/:id`、`/checkout`、`/payment/result` 路由

## Interface 對齊記錄（重要，換電腦必讀）

這些欄位名稱在最初建立時有誤，已全部修正對齊後端：

| Interface | 修正前 | 修正後 |
|-----------|--------|--------|
| `CampSearchRequest` | `checkIn/checkOut` | `checkInDate/checkOutDate` |
| `CampSearchRequest` | `page` | `pageNumber` |
| `CampSearchRequest` | 無 bbox 欄位 | 加上 `southWestLat/Lng`, `northEastLat/Lng`, `zoom` |
| `CampSearchResponseDto` | `total/items` | `totalCount/results`，加 `sortBy` |
| `CampMapResponseDto` | 無 clusters | 加上 `clusters: MapClusterItem[] \| null`, `markers: CampMapMarkerDto[] \| null` |
| `CampMapMarkerDto`（原 `CampMapMarker`）| 欄位不全 | `id, latitude, longitude, basePrice, name, area, coverImageUrl, averageRating, reviewCount` |
| `CampFilterDto` | `facilities` | `facilityTags`，統一用 `FilterTagItem { tagId, tagName, iconClass }` |
| `CampLocationDto` | `campgroundId/lat/lng` | `fullAddress/targetLatitude/targetLongitude` |
| `CampMapZoneDto` | 少欄位 | 加上 `zoneDescription`, `weekdayPrice`, `weekendPrice`, `nearbyFacilities: ZoneFacilityItem[]` |
| `EquipmentBreakdownItem` | `name/unitPrice/subTotal` | `productName+variantName?/pricePerUnit/itemSubTotal` |
| `CheckoutResultDto` | 成功欄位非 null | 所有成功欄位改為 `\| null`，加 `unavailableItems: string[] \| null` |
| `WithdrawalResultDto` | `feeCharged?/actualAmount?` | 改為必填（`feeCharged: number`, `actualAmount: number`）|
| 新增 `CampSearchOption` | 無 | `{ id: number; itemName: string; category: number }` |

## 共用元件

- `src/app/component/shared/camp-card/`：營區卡片元件（`app-camp-card`）
  - `@Input() camp!: CampSearchResultDto`（非空斷言，父元件一定傳）
  - 功能：多圖切換（左右箭頭 + 點點，循環用 `%` 取餘數）、愛心收藏（**只是前端切換，未串 API，後端尚無 Favorite 資料表**）、星評、highlights、tags
  - 首頁和搜尋結果頁共用，不要重複寫卡片 HTML

- `src/app/component/shared/search-bar/`：搜尋列元件（`app-search-bar`）
  - 三欄：地點（text input）、時間（`p-datepicker` range）、客人（`p-popover` + 計數器）
  - **客人面板動態載入**：`ngOnInit` 呼叫 `GET /api/Search/options`，依 `category` 分成「自帶裝備」（1）和「免裝備」（2）兩區，`@for` 渲染，每個品項獨立計數
  - 搜尋時把有數量的品項包成 `requirements: [{itemId, quantity}]`（JSON string 放進 queryParams）
  - 點搜尋按鈕導向 `/search?sortBy=Recommended&area=...&checkInDate=...&requirements=[...]`

## Roadmap 進度

### ✅ Phase F1：基礎架構 —— 完成

### ✅ Phase F2：首頁 —— 完成
檔案：`src/app/component/home/`

- 已串接 `GET /api/Exploration/home`
- Banner 輪播（`p-carousel`），對應 `HomeFeedDto.Announcements`
- **搜尋列浮在 banner 上**（CSS：`.banner-section { position: relative }`，`.banner-search { position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 10 }`）
- 熱門營區**水平橫向捲動**（Airbnb 風格）：`.camps-row { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none }`
  - 左右箭頭按鈕（`ViewChild('campsRow')` + `scrollCamps(direction: 1 | -1)`）
  - 最後一張「瀏覽全部」卡片：`routerLink="/search"` + `[queryParams]="{sortBy: 'Recommended'}"`
- Loading 時顯示 `p-skeleton` 骨架畫面
- 輪播指示點（綠色橢圓）已隱藏：`:host ::ng-deep .p-carousel-indicators { display: none }`

**重要業務邏輯（換電腦容易忘記）**：
- 後端 `GetFeaturedCampsAsync`（同仁 TING 已改善，commit `69fffbc go 首頁營區增加 try catch`）：
  - **候選名單**：原本只從「有評論」的營區裡選，現在改成「有評論」**聯集**「近期 30 天有訂單」的營區都會進入候選名單（`reviewStatsMap.Keys.Union(orderCountMap.Keys)`），沒評論但近期賣得不錯的營區也能上首頁熱門榜
  - 排序公式不變：`ReviewCount + OrderCount` 越高越優先，平均星數當第二排序
  - `Highlights` 解析加了防呆，抽成 `ParseHighlights()` + `try/catch (JsonException)`，格式不合法時回空清單而不是讓整支 API 炸掉
- `Highlights` 欄位：後端 `Campgrounds` 資料表**手動加了 `Highlights nvarchar(500)` 欄位**（沒用 EF Migration，換環境要重跑 `ALTER TABLE`），存 JSON 陣列字串

### ⬜ Phase F3：搜尋與地圖 —— 待開始
對應後端 Phase 2，service 已建好（`search.service.ts`），元件殼已建（`component/search/`）

- 搜尋結果列表（`POST /api/Search`，分頁），直接重用 `app-camp-card` 元件
- 篩選器（`GET /api/Search/filters`）
- 地圖模式（`POST /api/Search/map`，需要 Leaflet 或類似套件）
- **收到 queryParams 後要把 `requirements` JSON string parse 回陣列**再傳給 API

### ⬜ Phase F4：營區詳細頁 —— 待開始
### ⬜ Phase F5：日曆選位 —— 待開始（最複雜）
### ⬜ Phase F6：結帳流程 —— 待開始
### ⬜ Phase F7：付款確認/退款 —— 待開始
### ⬜ Phase F8：營主後台 —— 待開始

## 與本次無關但同仁負責的功能（不要混淆）
- `component/reviews/`：評論功能，已有 service 串 API（CRUD + 圖片上傳）
- `component/forum/`：論壇功能，service 目前是空的
- `component/member/`：會員登入/註冊，已完成，`MemberService` 處理 JWT
  - 注意 `islogin()` 目前會自動 `navigate()`，當判斷邏輯用容易有副作用

## 測試資料
- 資料庫已手動建立 3 個測試營區（Id 1-3）+ 對應 Zone/Campsite/Pricing/Tags/Facilities/CampMedia
- `AccomType` 表已建立 7 筆測試資料（Id 1-7），自帶裝備 3 筆（category=1）、免裝備 4 筆（category=2）
