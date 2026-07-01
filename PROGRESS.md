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
  - `camp-selection.service.ts`：管理甘特圖選位狀態，跨 `gantt-calendar`/`zone-detail`/`checkout` 共用，含 `setCampground()`/`campgroundId` getter（結帳頁靠這個知道要送哪個營區）
  - `checkout.service.ts`（結帳，含 `redirectToPayment()`，**已在 `/checkout` 頁面實際使用，Phase F6 完成**）
  - `payment.service.ts`（付款狀態/退款，**尚未在畫面上使用**，Phase F7 待做）
  - `owner-wallet.service.ts`（營主錢包，**尚未在畫面上使用**，Phase F8 待做）
  - `equipment-rental.service.ts` / `equipment-cart.service.ts`（裝備出租，同仁負責）
- `src/app/shared/map-icons.ts`：Leaflet 用的 SVG 圖示字串常數（`TENT_ICON_SVG`、`HOME_ICON_SVG`），多個地圖元件共用

## 路由總覽（`app.routes.ts`，務必以這份為準，文字描述常常漏項）

```
/                              首頁
/search                        搜尋/地圖
/camp/:id                      營區詳細頁（含甘特圖第一層）
/camp/:id/zone/:zoneId         Zone 細節頁（甘特圖第二層，✅ 已完成）
/camp/:id/rental                裝備出租（同仁）
/camp/:id/rental/equipment/:productId  裝備明細（同仁）
/attraction/:id                景點詳細頁
/checkout                      結帳（✅ 已完成，Phase F6）
/payment/result                付款結果（空殼，未實作，Phase F7）
/review, /review/add           評論（同仁）
/forum, /post, /post/:id       論壇（同仁）
/member-center (+children: orders, memberEdit, 預設 profile)   會員中心（同仁，有 authGuard）
/ownerCenter                   營主中心（同仁，有 authGuard，已有 owner-profile 子路由，不再是純空殼）
/register, /login, /verify-email, /resend-verify-email, /forgot-password, /reset-password, /owner-register   會員註冊登入（同仁）
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

### ✅ Phase F5：甘特圖選位 — 完成（兩層都做完了）

**架構說明**：不是獨立頁面，`camp-detail.html` 裡引用 `<app-gantt-calendar>` 子元件（`src/app/component/camp-detail/gantt-calendar/`），第二層 `zone-detail` 才是獨立路由 `/camp/:id/zone/:zoneId`。

#### ✅ 第一層：`gantt-calendar` 元件
檔案：`src/app/component/camp-detail/gantt-calendar/gantt-calendar.ts`

已實作功能：
- 拖拉選取日期格子（`onCellMouseDown` / `onCellMouseEnter` / 全域 `mouseup`）
- **退房日語意（重要，跟最早版本不一樣，後來改過）**：放開滑鼠的那一格直接就是退房日，不額外+1 天；至少要拖 2 格（1 晚）才算有效選位，只點 1 格直接忽略
- 同列重疊/緊接選位自動合併成一筆連續區間（`addOrMergeSelection`）
- **入住/退房格視覺區分**：`isRangeStart`（入住格，淺色+圓角）、`isCheckoutDay`（退房格，可以直接按 X 取消這筆選位，`canRemoveAtCheckout`/`removeAtCheckout`）
- **Generic 選位的甘特圖視覺示意（`recomputeGenericHighlights`，有修過一次 bug）**：Generic 從 Zone 詳細頁選的沒有真實帳位（`displayRowCampsiteId=0`），純前端在目前已載入的甘特圖列裡，逐筆檢查「這一列這天有沒有被佔用」分配到不同列上做高亮顯示——**舊寫法的 bug**是按「日期區間」分組各自獨立計算，導致不同批次選位都從第一列開始算、互相不知道彼此佔用了哪些列，重疊堆疊在前面幾列。現在改成逐筆檢查整合所有來源（直接拖曳+Zone 詳細頁選位）的列佔用狀態，同一列只要日期不重疊就能重複使用
- 日期表頭加顯示星期幾（`dayOfWeek()`），週六日不特別標色（平日/假日是看「週六日或國定假日」，只標週六日顏色會誤導）
- Prev/Next 10 天視窗切換，`jumpToDate()` 供外部呼叫跳轉
- 右側 Zone 地圖（Leaflet + GeoJSON，衛星空拍底圖 Esri）：選位即時變色（藍→黃）、permanent tooltip 顯示已選格數+日期、hover 發光、點色塊進第二層
- INFO 彈窗（`openInfo`）：`GET /api/Calendar/zone/{zoneId}/detail` + 從父層 `zones` 直接取價格（不重複打 API）
- 計算金額：`POST /api/Calendar/summary`
- **「前往結帳」入口**（`goToCheckout`）：彈窗問要不要加購裝備，串到 Phase F6（見下方）

#### ✅ 第二層：`zone-detail` 元件
檔案：`src/app/component/camp-detail/zone-detail/zone-detail.ts`

已完整實作：
- 頁面內自己選日期（`p-datepicker` range），選完才打 `getZoneCalendar()` 拿正確可訂狀態/價格
- Zone 介紹區塊：照片格宮（點擊開 `app-lightbox`）+ 簡介 + 設施標籤
- **Generic（`zoneType===1`）**：數量選擇器，`maxAvailableQuantity` **逐天比對**「後端剩餘量」扣掉「同一天已經在前端選位清單裡的數量」取整段期間最小值——**不能只比對日期完全相同**，因為兩次選位日期重疊但不完全一樣（例如 6/30~7/3 跟 6/30~7/2）還是會搶到同一批實體帳位，要逐天檢查才能真正擋住重疊
- **UniqueUnit（`zoneType===2`）**：卡片網格，**可以一次勾選多張**（購物車邏輯），`isAlreadyBookedElsewhere()` 擋掉「使用者自己已經在別的地方選過同一個 `campsiteId` 且日期重疊」的卡片（後端 `unit.isAvailable` 只看資料庫真實庫存，不知道前端選位清單裡已經佔用的）；卡片可以點「查看詳情」開 `p-dialog` 看完整照片/簡介/設施再決定要不要選
- 衛浴是訂房決策關鍵資訊，`hasBathroom()` 直接在卡片上顯示徽章，不用點進詳情才看到
- **確認送出（`confirm()`）**：
  - Generic → `calendarService.getGenericZoneSummary({zoneId, quantity, checkInDate, checkOutDate})` → 後端回傳的 `items` 筆數展開成對應筆數的 `CampSelectionEntry`（`campsiteId: 0`、`displayRowCampsiteId: 0`，甘特圖那邊靠 `recomputeGenericHighlights` 自己挑列顯示）
  - UniqueUnit → 對每個勾選的 unit **各自呼叫一次** `getUnitZoneSummary({campsiteId, checkInDate, checkOutDate})`（`forkJoin` 同時送出，全部成功才寫入），**後端這支 API 一次只接受一個 campsiteId，沒有改成批次版本**，前端用迴圈+`forkJoin`處理
  - 全部寫進 `CampSelectionService.addMany()` 後 `router.navigate(['/camp', campgroundId])` 回第一層
- 日期格式化**不能用 `toISOString()`**：`p-datepicker` 給的是本地時間午夜的 `Date`，`toISOString()` 會轉成 UTC（台灣 UTC+8 等於減 8 小時）可能跨到前一天，要直接讀本地年/月/日組字串

**還沒做**：選完從 Zone 詳細頁回到甘特圖時，如果選的日期超出甘特圖目前視窗，要自動呼叫 `jumpToDate()` 跳過去——這個串接目前還沒做，`jumpToDate()` 方法已經存在但沒人呼叫它。

---

### 🟡 Phase F6：結帳流程 — 已實作並實測過完整流程，剩 F7 銜接

**⚠️ 後端同時在做「庫存鎖定釋放機制」**（背景排程+付款失敗/退款釋放庫存），詳見 `slnCampApi/PROGRESS.md` 同名章節，跟這個 Phase 是同一輪討論決定的，互相關聯但是後端範圍。

**已確認的流程**（跟 PROGRESS.md 原本寫的「先摘要頁→問加購→填資料」順序不同，這次討論後改成）：

```
甘特圖按「前往結帳」
  → 彈出確認視窗：「要加購露營裝備嗎？」[要]/[不要]
      ├─ 要   → 導到 /camp/:id/rental（同仁的頁面，選完會自動寫 sessionStorage 並導回 /checkout）
      └─ 不要 → 直接導到 /checkout
  → /checkout 「一頁完成」：不做獨立摘要頁，理由是使用者到這裡已經沒有新的選擇要做了，
    只剩「看金額」+「填聯絡資料」兩件事，沒必要多一次頁面跳轉
    - Layout 仿 Airbnb 訂房確認頁：左欄（可捲動）填聯絡人資料 + 確認付款按鈕，
      右欄（sticky 固定）顯示完整明細卡片（營位+裝備+折扣+總額）
  → 按「確認付款」→ POST /api/Checkout/submit（建立 Order + 鎖庫存 + 算好綠界表單參數，
    這一步本身不會跳轉畫面）→ 同一個按鈕的處理函式緊接著呼叫 checkoutService.redirectToPayment()
    （動態組 form.submit()，瀏覽器才真的離開網站跳到綠界）→ 全部在使用者按一次「確認付款」內完成，
    中間不會停在任何中繼畫面
```

**裝備加購的交接機制（同仁已經做好，不用我們碰）**：
- `EquipmentCartService.STORAGE_KEY = 'equipmentSelection'`，使用者在 `/camp/:id/rental` 選完確認後，
  把 `StoredEquipmentSelection`（`selectedEquipments`、`shippingMethodId`、`equipments`、`equipmentSubTotal`）
  寫進 `sessionStorage`，導回 `/checkout`
- 使用者按「不需要裝備」（`skip()`）會清空這個 key 再導回 `/checkout`
- **`/checkout` 不用再額外打 API 問裝備資訊**，裝備金額已經在 `sessionStorage` 裡算好了，直接讀出來用，
  跟營位金額（後端 `/Checkout/summary` 算的）在前端合併顯示就好

**重要：促銷折扣計算範圍**（已查證後端程式碼）：`/Checkout/summary`（`CheckoutService.GetSummaryAsync`）
**只看營位金額**算「滿額折扣」，`Equipments`/`EquipmentSubTotal` 在這支 API 裡固定是空白佔位
（DTO 註解寫死「裝備加購由其他同仁負責」）。所以折扣門檻不含裝備金額，這是後端現有設計，
前端顯示時要注意：折扣是算在 `campSubTotal` 上，`grandTotal` 顯示時要自己把 `equipmentSubTotal`
加上去（`/Checkout/summary` 回傳的 `grandTotal` 不含裝備）。

**`CampSelectionService` 缺一個公開的 `campgroundId` getter**：目前 `currentCampgroundId` 是 private，
`checkout.ts` 需要知道要送哪個 `campgroundId` 給 `/Checkout/summary`，要加一個 public getter。

**已實作完成**（2026-06）：
- `gantt-calendar.ts`：`goToCheckout()` 改成先彈出「要加購露營裝備嗎？」確認視窗（`showAddonPrompt`），
  `confirmAddon()` 導去 `/camp/:id/rental`（**有附上 `checkIn`/`checkOut` query params**——
  取所有選位裡最早入住日~最晚退房日當整趟行程範圍，不然裝備頁會抓不到日期，租金天數預設算 1 晚會錯），
  `skipAddon()` 直接導去 `/checkout`
- `camp-selection.service.ts` 加了公開的 `campgroundId` getter
- `checkout.ts`/`.html`/`.css` 完整實作：
  - 左欄（可捲動）：聯絡人資料表單（姓名/手機/Email）+「確認付款」按鈕
  - 右欄（sticky）：明細卡片（營位明細 + 裝備明細 + 折扣 + 總金額），仿 Airbnb 訂房確認頁排版
  - `ngOnInit` 同時做兩件事：呼叫 `/Checkout/summary`（只送營位）+ 讀 `sessionStorage` 的裝備資料
    （`EquipmentCartService.STORAGE_KEY`），兩邊資料在前端合併顯示，**裝備不用再打一次 API**
  - `grandTotal` = 後端回的營位 `grandTotal`（已扣折扣）+ 前端自己加上去的裝備小計
  - 送出後：成功 → 清空 `CampSelectionService` + 裝備 sessionStorage → 呼叫
    `checkoutService.redirectToPayment()` 跳轉綠界；失敗 → 顯示 `unavailableItems` 清單，不跳轉
  - **「完全沒有選位資料時」的處理（之前說還沒決定，這次先選了一個合理預設）**：
    顯示「找不到你的選位資料」+ 一個回首頁的按鈕，不是自動強制導頁——
    如果你想改成自動導回首頁，之後再調整即可
- 後端同步完成「庫存鎖定釋放機制」（詳見 `slnCampApi/PROGRESS.md`），但**還沒整合測試過**，
  因為要先有真正送出過 `/Checkout/submit` 才會產生待付款訂單可以測

**還沒做**：
- 表單欄位驗證目前只有「不能是空字串」，沒有檢查 Email 格式、手機格式
- `/checkout` 頁面還沒接綠界付款結果回來後的下一步（那是 Phase F7，見下方待辦）

### 🟢 結帳實測抓到並修好的前端 bug（2026-06-29~30）

**1. 401 自動導去登入頁，沒有 `returnUrl`，登入完不會回到原本的頁面**

**⚠️ 動到同仁負責的範圍**（`component/member/`，本文件「同仁負責的功能」清單裡的檔案），記得跟負責會員功能的同仁說一聲這兩個改動：

- **檔案：`src/app/component/member/Service/interceptor.ts`**
  - 改動位置：攔截到 401 時的處理（`catchError` 裡）
  - Before：
    ```ts
    if (error.status === 401) {
      memberservice.clearLoginData();
      router.navigate(['/login']);
    }
    ```
  - After：
    ```ts
    if (error.status === 401) {
      memberservice.clearLoginData();
      router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
    }
    ```
  - 原因：原本被導去登入頁時完全沒記住使用者原本在哪一頁（例如 `/checkout`），登入完只能回首頁，使用者要自己手動找回去。

- **檔案：`src/app/component/member/login/login.ts`**
  - 改動 1：constructor 多注入 `ActivatedRoute`（import 也加了 `ActivatedRoute`）
  - 改動 2：`GetloginApi()` 登入成功的 `next` callback 裡
  - Before：
    ```ts
    this.routes.navigate(['/']);
    ```
  - After：
    ```ts
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.routes.navigateByUrl(returnUrl || '/');
    ```
  - 原因：跟上面那個改動是一組的，沒有這個改動，`interceptor.ts` 帶的 `returnUrl` 也沒用，登入完還是會被導去首頁。

兩個檔案合起來的效果：**沒登入被導去登入頁時，網址會變成 `/login?returnUrl=/checkout`，登入成功後會自動導回 `/checkout`，不會只回首頁。**

**2. `checkoutService.redirectToPayment()` 沒設 `input.type='hidden'`，付款表單欄位整個顯示在畫面上**
動態建立的 `<input>` 預設是 `text` 類型，會員可以直接看到一串綠界表單參數的亂碼文字。已補上 `input.type = 'hidden'`。

**3. `redirectToPayment()` 失敗時畫面卡死在「處理中」**
原本沒有回傳值，如果 `paymentServiceUrl` 缺漏（例如後端設定沒填），會靜默不跳轉，但畫面的 `submitting` 狀態沒有復原，使用者卡在「處理中」按鈕動彈不得。
已改成回傳 `boolean`，`checkout.ts` 收到 `false` 才會重置 `submitting` 並顯示錯誤訊息；另外調整了清空 `CampSelectionService`/sessionStorage 的時機，改成**確認真的成功跳轉之後才清空**，避免跳轉失敗又把選位資料弄丟。

**4. `checkout.ts` 的 `error` callback 沒有讀後端真正的錯誤訊息**
後端對「部分營位無法訂購」「已有待付款訂單」這類業務邏輯失敗回的是 HTTP 409，Angular `HttpClient` 會當成 error 處理，原本只顯示寫死的通用文字，使用者看不到真正原因。
已改成讀 `err.error?.message` / `err.error?.unavailableItems` 顯示真正的後端訊息。

---

### 🟢 卡單救援 + 通知 + 裝備收款（2026-07-01，本輪大更新）

搭配後端同名章節（`slnCampApi/PROGRESS.md` 2026-07-01）。前端這輪的改動：

**A. 卡單救援 UI（付款到一半放棄/當機/關瀏覽器）**
- `checkout.service.ts`：`cancelPending(orderId?)`、`resumePayment(orderId)`。
- `checkout.ts`/`.html`：`/checkout` 空狀態（找不到選位資料）新增「檢查並釋放卡住的訂單」按鈕；另有 `pageshow`/bfcache 處理（按綠界上一頁回來不會卡在「處理中」）。
- `component/member/orders/`（**同仁的檔案，已加東西，記得跟同仁說**）：待付款訂單列新增「繼續付款 / 取消訂單」按鈕（`resumePayment()`/`cancelOrder()`，用 `processingOrderId` 控制單列 loading）。這是使用者關掉瀏覽器後最自然的救援入口。

**B. 選位資料持久化**
- `camp-selection.service.ts`：改用 `sessionStorage` 持久化選位（key `campSelection`），跳去綠界再回來（整頁導覽）選位資料不會掉。
- 清空時機：**不在送出訂單跳綠界時清**（那樣會害重試/取消失效），改在 `payment-result.ts` 拿到確定結果（Success/Failed）時才清。

**C. 裝備 + 運費金額顯示（單一來源）**
- `checkout.ts`：`/Checkout/summary` 現在**一併送 `selectedEquipments` + `shippingMethodId`**，後端回傳「已含裝備租金 + 運費」的 `grandTotal`。前端 `grandTotal` getter 改成直接回 `summary.grandTotal`，**不再自己加**（畫面金額 == 實際刷卡金額）。
- `checkout.html`：裝備明細/小計改讀 `summary.equipments`/`summary.equipmentSubTotal`，新增「運費」明細列（`summary.shippingFee`）。
- `camp.interface.ts`：`CampSelectionRequestDto` 加 optional `selectedEquipments`/`shippingMethodId`；`CheckoutSummaryDto` 加 `shippingFee`。
- **⚠️ 後端要先跑 `DbScripts/2026-07-01-add-equipment-order-columns.sql` 加欄位，否則後端啟動會報錯。**

## 📌 下次接續：待辦事項（不要漏掉）

1. ~~**後端在等 ngrok 設定好**~~ **（已可暫緩）**：付款成功 → 訂單狀態變已付款這條路徑**現在靠 OrderResultURL 在本機就能通、已實測成功**，`/payment/result` 頁也已測過真的綠界回調。ngrok 只剩 server-to-server `ReturnUrl` 備援用途，上雲端再處理。
2. ~~Phase F7 付款結果頁~~ **已完成**（見下方 Phase F7 章節）。
3. 表單欄位驗證（Email/手機格式）還沒做，目前只擋空字串。
4. **`gantt-calendar.ts` 的 `jumpToDate()` 方法目前沒有任何地方呼叫它**（已確認，`grep` 全專案只有定義沒有使用）：Zone 詳細頁選完日期回到甘特圖，如果選的日期超出甘特圖目前 10 天視窗，使用者看不到自己選的東西反映在畫面上，要接起來。

### 🟡 Phase F7：付款確認/退款 — 付款結果頁完成，退款流程未開始

**問題根源**：後端 `PaymentController.PaymentResult`（接綠界 `OrderResultUrl` 的 POST 回調）原本寫死導回 `/checkout?orderNumber=xxx`，是 Phase F6 做完後留的暫時做法（程式碼裡原本就有 TODO 註解標明）。`/checkout` 頁面從來沒有處理過 `orderNumber` 這個 query param，使用者付完款回來看到的是「找不到選位資料」（因為 `CampSelectionService` 早就在送出訂單時被清空了），不是付款結果。

**已完成**：
- 後端 `CampApi/Controllers/PaymentController.cs`：`PaymentResult` 導回目標改成 `{frontendBase}/payment/result?orderNumber={merchantTradeNo}`
- 前端 `src/app/component/payment-result/`：
  - 讀網址 `orderNumber` query param，沒有的話顯示錯誤訊息（不嘗試輪詢）
  - 輪詢 `PaymentService.getStatus(orderNumber)`，**每 3 秒一次**，狀態變成非 `Processing`（`Success`/`Failed`）就停止輪詢
  - **逾時保護**：輪詢超過 30 秒還是 `Processing` 就自動停止，顯示「確認中」+ 手動「重新檢查」按鈕（`retryCheck()`），不會無限輪詢打 API
  - 成功/失敗畫面都有「查看訂單」（連到 `/member-center/orders`，同仁的會員中心）和「回首頁」連結

**還沒做**：
- 退款流程（`calculateRefund()`/`submitRefund()` 已經在 `payment.service.ts` 寫好，但畫面完全沒做，應該是會員中心訂單頁面（同仁負責）要加「申請退款」按鈕串過來，這塊要跟同仁協調）
- 本機測試還卡在 ECPay webhook 打不到 `localhost`（PROGRESS.md 上面提過，等使用者 ngrok 設定好）

### ⬜ Phase F8：營主後台/錢包 — 未開始
- `/ownerCenter` 路由（同仁負責，`component/layouts/owner-center/`）已經有 `owner-profile` 子路由在用，不是純空殼，但**錢包功能還沒人接**
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
