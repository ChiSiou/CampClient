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

### ✅ Phase F3：搜尋與地圖 —— 完成
檔案：`src/app/component/search/`、`src/app/component/shared/search-filters/`

對應後端 Phase 2，`search.service.ts` 已用：`search()`（卡片清單）、`searchMap()`（地圖標記）、`getFilters()`、`getOptions()`

**版面結構**：
```
┌─────────────────────────────────────────────┐
│ 搜尋 Bar（compact 模式）+ 篩選按鈕              │ ← 只在卡片欄上方，不是整頁寬
├─────────────────────────────────────────────┤
│ 共 N 筆結果              排序選單（p-select）   │
├──────────────────┬────────────────────────────┤
│ 卡片清單 (40%)     │      地圖 (60%)            │
│ 可上下滑動 + 分頁   │      sticky 固定           │
└──────────────────┴────────────────────────────┘
```

**Query Params 設計（核心，全部用 `router.navigate(..., { queryParamsHandling: 'merge' })`）**：
- `area`, `checkInDate`, `checkOutDate`, `requirements`（JSON string，`[{itemId,quantity}]`）：來自搜尋 Bar
- `tagIds`, `facilityIds`（逗號分隔字串）, `minElevation`, `minRating`：來自篩選彈窗
- `sortBy`：來自排序選單
- `pageNumber`, `pageSize`：來自分頁器
- `southWestLat/Lng`, `northEastLat/Lng`, `zoom`：來自地圖 bbox（見下方 Leaflet 章節）
- **重要**：任何一處改變條件都只更新自己負責的欄位，用 `merge` 不覆蓋其他欄位；數量歸零/清空欄位時要明確傳 `null`（不能略過不寫），否則 `merge` 不會清掉網址上的舊值（踩過的坑：小木屋 -1 到 0 後永遠查 0 筆，就是這個原因）
- 排序/篩選/搜尋 Bar 套用條件都會把 `pageNumber` 重置回 1，避免「篩到剩 5 筆但還停在第 3 頁」空畫面

**篩選彈窗**（`search-filters` 元件）：
- 按鈕 + `p-dialog`，彈窗內分區：海拔高度（`p-slider` 垂直）、營區評價門檻（`p-radioButton`）、環境/政策/設備（`p-checkbox` + icon，從 `GET /api/Search/filters` 動態載入）
- 「套用篩選」才寫回網址，「清除全部」重置內部 state（不會自動套用）

**搜尋 Bar 重用注意**：同一個 `app-search-bar` 元件首頁（浮動大尺寸）和搜尋頁（`[compact]="true"` 縮小版）共用，差異靠 CSS class 切換，不是兩個元件

**卡片清單**：
- `app-camp-card` 加 `[layout]="'horizontal'"`（左圖右內容），首頁繼續用預設 `vertical`
- **固定高度 220px**，`overflow:hidden` + highlights/tags 限制 `max-height` 裁切，避免資料量不同造成每張卡片高度不一致（價格/星評位置跑掉）
- `p-paginator` 每頁 20 筆，地圖**不受分頁影響**，永遠顯示全部符合條件的 markers（這是 Airbnb 的標準做法，地圖不該因為翻頁而重排閃爍）

**後端這次同步補上的篩選邏輯**（`SearchService.GetFilteredCampgroundsAsync`）：
- `MinElevation`：`Elevation >= MinElevation`
- `MinRating`：要先算出 `ratings` 字典才能篩，所以插在 `GetReviewStatsAsync` 之後、排序之前（`SearchAsync` 和 `GetMapMarkersAsync` 都要插）
- `TagIds`/`FacilityIds`：AND 邏輯（全部選的條件都要符合），標籤用 `TagMapping` 分組計數比對，設施用 `Campground.Facilities` 巢狀 `All+Any`
- **地點搜尋 bug 修正**：`Area == query.Area`（完全比對）→ `Area.Contains(query.Area)`（模糊比對），不然搜「南投」配不到資料庫存的「南投縣埔里鎮」

---

#### Leaflet 地圖串接（Phase F3 的子任務，這次重點）

**套件**：`leaflet` + `@types/leaflet` + `leaflet.markercluster` + `@types/leaflet.markercluster`

**`angular.json` 改動**（換電腦/拉新分支記得檢查這兩處還在）：
```jsonc
"styles": [
  "node_modules/leaflet/dist/leaflet.css",
  "node_modules/leaflet.markercluster/dist/MarkerCluster.css",
  "node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css",
  // ...
],
"assets": [
  { "glob": "**/*", "input": "public" },
  { "glob": "**/*", "input": "node_modules/leaflet/dist/images", "output": "assets/leaflet/" }
]
```

**核心概念**：Leaflet 是命令式操作 DOM 的庫，跟 Angular 宣告式 binding 不是同一套邏輯，所以用 `@ViewChild('mapContainer')` 抓 DOM 容器 + `ngAfterViewInit`（不能用 `ngOnInit`，DOM 還沒渲染完）手動呼叫 `L.map().setView()` 初始化。

**已踩的坑（重要，不要重蹈覆轍）**：
1. **地圖容器 CSS 一定要有明確 `width`/`height`**，不然地圖空白
2. **預設圖示 404**：`L.Icon.Default` 內部 `_getIconUrl` 永遠會自動加偵測到的 `imagePath` 前綴（即使你給絕對路徑也會被疊加，例如疊出 `/media/assets/leaflet/...` 這種錯誤路徑），**唯一解法是 `delete (L.Icon.Default.prototype as any)._getIconUrl`**，讓它改用父類別 `Icon` 單純回傳 `options.xxxUrl` 的版本，不會加前綴。後來直接換成自訂 `L.divIcon`（見下方）後這個問題就無關了，但保留這段防呆
3. **CSS `transform` 不能加在 Leaflet 用來定位圖示的元素上**：Leaflet 用 inline `style.transform = translate3d(...)` 控制圖釘座標，你的 CSS `transform`（旋轉、縮放）如果套在同一個元素會把定位覆蓋掉，圖釘位置會跑掉。解法：造型/動畫都包在**內層子元素**（例如 `.camp-marker-pin`），外層 `divIcon` 的 `className` 只負責定位，不要加任何 `transform`
4. **`leaflet.markercluster` 是 side-effect import**：`import 'leaflet.markercluster'` 不用接收回傳值，純粹擴充 `L.markerClusterGroup()` 方法
5. **圖示授權**：不能直接抓商業圖示站（如 Streamline）的圖案，免費版通常要求標註來源、商用可能違反條款。改用 MIT 授權的 [Tabler Icons](https://github.com/tabler/tabler-icons)，直接複製 `<path>` SVG markup 字串嵌入 `divIcon` 的 `html`，不需要額外裝 npm 套件

**自訂營區圖示**（`campIcon`，`search.ts`）：
- `L.divIcon`：綠色水滴形圖釘（`border-radius: 50% 50% 50% 0` + `rotate(-45deg)`）+ Tabler 帳篷 SVG（`stroke="currentColor"` 讓顏色跟著 CSS `color` 走）
- 之後加「景點」標記，複製這個寫法、換顏色/換 SVG 即可（同一套架構）

**Marker Popup**：仿 Airbnb 卡片風格（圖片 + 左上角分類標籤 + 名稱 + 地區 + 評分/價格），`L.divIcon`/`bindPopup` 的內容都是純字串 HTML，不是 Angular 模板，所以 popup 內的 CSS 也要用 `::ng-deep`

**Hover 卡片 ↔ 地圖連動**（`onCardHover`/`onCardHoverEnd`）：
- `(mouseenter)`/`(mouseleave)` 直接綁在 `<app-camp-card>` 標籤上（不用改 camp-card 元件加 `@Output`，因為是原生 DOM 事件，父層模板可以直接監聽子元件 host 元素）
- `markersByCampId: Map<number, L.Marker>` 記錄 campId → marker 的對應關係
- **重要設計決策**：hover **絕對不能移動/縮放地圖**（一開始用 `zoomToShowLayer` 會自動縮放，使用者發現會跟「拖地圖換結果」的設計衝突，已改掉）
- 用 `clusterGroup.getVisibleParent(marker)` 找出「目前畫面上看得到、代表這個營區的東西」（可能是個別圖釘，也可能是代表它的群聚圓圈），只對看得到的東西加 CSS class 凸顯，看不到就不處理
- 只有 `getVisibleParent(marker) === marker`（該圖釘本身就可見，沒被群聚收起來）才會 `openPopup()`；被收進群聚圓圈時不開 popup（沒有單一營區內容可顯示）
- 凸顯效果：個別圖釘放大內層 `.camp-marker-pin`（安全，是內層元素的 width/height，不是 transform）；群聚圓圈用 `filter: drop-shadow` 發光（無法動結構，只能用 filter）

**Clustering**：`L.markerClusterGroup()` 包住所有 markers，縮放層級自動決定顯示個別圖釘還是橘色數字圓圈，不用自己寫合併演算法

**bbox 同步查詢**（`onMapMoveEnd`）：
- 監聽 `map.on('moveend', ...)`（拖拉/縮放**結束後**才觸發一次，天然節流，不用自己 debounce）
- 算出 `map.getBounds()` 四個角座標 + `getZoom()`，寫進網址（`merge`，並重置 `pageNumber: 1`）
- **不會無限迴圈**：查詢結果回來後只更新卡片/markers，不會反過來呼叫 `map.setView()`，所以不会再次觸發 `moveend`
- 地圖剛載入時 `setView()` 本身也會觸發一次 `moveend`，所以一進 `/search` 網址就會自動補上對應目前畫面範圍的 bbox 參數，這是預期行為

**已知限制／待加強**（不是 bug，是刻意先簡化的部分）：
- Marker 數量上限 200（後端 `MapMarkerMaxCount`），超過直接截斷不分群（`IsClustered` 永遠回 `false`），跟前端 `leaflet.markercluster` 是兩個獨立機制——前端的群聚只是「畫面呈現」，不是「後端真的把資料庫筆數合併」
- 目前地圖只有「營區」一種標記，景點（Attraction）標記還沒做，圖示寫法已經設計成可以直接複製套用的架構

### ⬜ Phase F4：營區詳細頁 —— 待開始
### ⬜ Phase F5：日曆選位 —— 待開始（最複雜）
### ⬜ Phase F6：結帳流程 —— 待開始
### ⬜ Phase F7：付款確認/退款 —— 待開始
### ⬜ Phase F8：營主後台 —— 待開始

## JWT 認證機制（重要，換電腦/換對話容易搞混）

- **JWT token 流程**：登入成功後端回傳 token → 前端存 `localStorage.setItem('token', ...)`（同仁 `login.ts` 寫的）→ 之後呼叫「需要登入」的 API 要在 Header 帶 `Authorization: Bearer <token>` → 後端 `[Authorize]` 檢查
- **`[Authorize]` 是後端逐個 controller/method 標記的，不是整個網站開關**：沒標記的 API（首頁、搜尋、營區詳情）不用登入就能呼叫；標記了的 API（營主錢包、結帳）沒帶 token 或 token 失效會被擋下回 401
- **HTTP Interceptor 曾經做過又刪掉**：原本想寫一個全域 interceptor（`src/app/interceptors/auth.interceptor.ts`，在 `app.config.ts` 用 `provideHttpClient(withInterceptors([authInterceptor]))` 註冊），讓所有 `HttpClient` 請求自動帶 token，不用每個 service 自己手動加 header
  - **後來發現同仁已經寫好一個一樣的 interceptor，已經刪除我們這邊重複的版本**（commit `刪除JWT 因為有人做了`），**換電腦/開新對話不要再重新生成一次**，先確認同仁的 interceptor 實際檔名/邏輯再決定要不要調整
  - 同仁 `member-service.ts` 裡有 3 處（`OwnerRegister`、頭像上傳、`MemberEdit`）手動加 `Authorization` header 寫法，跟 interceptor 並存不會壞（`setHeaders` 同名覆蓋），但理論上裝了 interceptor 之後是多餘的，**先不要動，等同仁自己決定要不要清掉**

## 與本次無關但同仁負責的功能（不要混淆）
- `component/reviews/`：評論功能，已有 service 串 API（CRUD + 圖片上傳）
- `component/forum/`：論壇功能，service 目前是空的
- `component/member/`：會員登入/註冊，已完成，`MemberService` 處理 JWT
  - 注意 `islogin()` 目前會自動 `navigate()`，當判斷邏輯用容易有副作用

## 測試資料
- 資料庫已手動建立 3 個測試營區（Id 1-3）+ 對應 Zone/Campsite/Pricing/Tags/Facilities/CampMedia
- `AccomType` 表已建立 7 筆測試資料（Id 1-7），自帶裝備 3 筆（category=1）、免裝備 4 筆（category=2）
