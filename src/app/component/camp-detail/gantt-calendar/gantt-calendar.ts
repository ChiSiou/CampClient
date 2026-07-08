import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  HostListener,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import * as L from 'leaflet';
import { CalendarService } from '../../../services/calendar.service';
import { CampSelectionService, CampSelectionEntry, ZoneSelectionSummary } from '../../../services/camp-selection.service';
import { GanttRowItem, CampOrderSummaryDto, CampMapZoneDto, CampZoneDetailDto } from '../../../interfaces/camp.interface';
import { TENT_ICON_SVG, HOME_ICON_SVG } from '../../../shared/map-icons';
import { Lightbox } from '../../shared/lightbox/lightbox';
import { environment } from '../../../../environments/environment';

interface DragState {
  rowIndex: number;
  startDateIndex: number;
  endDateIndex: number;
}

@Component({
  selector: 'app-gantt-calendar',
  imports: [NgClass, DecimalPipe, DialogModule, Lightbox],
  templateUrl: './gantt-calendar.html',
  styleUrl: './gantt-calendar.css',
})
export class GanttCalendar implements OnInit, OnChanges, AfterViewInit {
  @Input({ required: true }) campgroundId!: number;
  @Input() zones: CampMapZoneDto[] = [];
  @ViewChild('zoneMapEl') zoneMapEl!: ElementRef<HTMLDivElement>;

  private zoneMap?: L.Map;
  private zoneLayers = new Map<number, L.GeoJSON>();
  private zoneMapReady = false;

  matrixDates: string[] = [];
  ganttRows: GanttRowItem[] = [];
  loading = true;

  startDate = this.formatDate(new Date());
  days = 10;
  private readonly todayStr = this.formatDate(new Date());

  drag: DragState | null = null;

  selections: CampSelectionEntry[] = [];
  orderSummary: CampOrderSummaryDto | null = null;
  calculating = false;

  // INFO 彈窗狀態
  infoVisible = false;
  infoLoading = false;
  infoDetail: CampZoneDetailDto | null = null;
  infoPricing: { weekdayPrice: number; weekendPrice: number } | null = null;
  showLightbox = false;
  lightboxIndex = 0;

  // 「要不要加購裝備」確認彈窗
  showAddonPrompt = false;

  constructor(
    private calendarService: CalendarService,
    private campSelectionService: CampSelectionService,
    private router: Router,
  ) {}

  // Generic 選位來自 Zone 細節頁時沒有具體帳位（displayRowCampsiteId=0），
  // 這裡幫忙「挑」同 Zone 底下的格子來視覺示意選了幾個、選了哪幾天，純粹畫面用，不影響送出給後端的資料
  private genericHighlightRanges = new Map<number, { checkIn: string; checkOut: string }[]>();

  ngOnInit() {
    this.campSelectionService.selections.subscribe(entries => {
      this.selections = entries;
      this.orderSummary = null; // 選位變了，舊的金額計算結果失效，要重新按「計算金額」
      this.recomputeGenericHighlights();
      if (this.zoneMapReady) this.updateZoneLayers();
    });
    this.loadGantt();
  }

  // 把所有「沒有具體帳位」的 Generic 選位逐筆分配到該 Zone 底下的帳位列，讓甘特圖左側也能反白示意。
  // 不能按「日期區間」分組各自獨立計算（舊寫法的 bug）：那樣會讓不同批次的選位都各自從第一列開始算，
  // 完全不知道其他批次已經佔用哪些列，導致重疊堆疊在前面幾列、後面的列永遠用不到。
  // 正確做法是逐筆檢查「這一列在這天有沒有被佔用」，同一列只要日期不重疊就可以重複使用（這是正常的），
  // 日期重疊時才需要換一列。
  private recomputeGenericHighlights() {
    this.genericHighlightRanges.clear();

    const genericEntries = this.selections.filter(
      s => s.displayRowCampsiteId === 0 && s.zoneType === 1 && s.zoneId !== null
    );

    const byZone = new Map<number, CampSelectionEntry[]>();
    genericEntries.forEach(s => {
      const zoneId = s.zoneId as number;
      const list = byZone.get(zoneId) ?? [];
      list.push(s);
      byZone.set(zoneId, list);
    });

    byZone.forEach((entries, zoneId) => {
      const rowsInZone = this.ganttRows.filter(r => r.zoneType === 1 && r.zoneId === zoneId);

      // 記錄每一列目前已經分配了哪些日期區間——先把「直接拖曳在這一列」的選位也算進已佔用範圍，
      // 不然 Generic 從 Zone 細節頁選的可能會誤判這列是空的，跟直接選位搶同一列同一天，
      // 導致實際上明明有 3 筆選位，畫面卻只反白 2 列（第三列被浪費掉沒用到）
      const rowAssignments = new Map<number, { checkIn: string; checkOut: string }[]>();
      rowsInZone.forEach(r => {
        const directOnThisRow = this.selections
          .filter(s => s.displayRowCampsiteId === r.campsiteId && s.zoneType === 1)
          .map(s => ({ checkIn: s.checkInDate, checkOut: s.checkOutDate }));
        rowAssignments.set(r.campsiteId, directOnThisRow);
      });

      entries.forEach(entry => {
        // 找一列「目前還沒有跟這筆選位日期重疊」且「這段期間本身真的是空的（沒被別人訂走）」的列，
        // 兩個條件都要滿足才能用——只檢查「不跟其他選位重疊」不夠，還要檢查真實庫存狀態，
        // 不然可能挑到一列剛好在這段日期裡有別人真實訂走的天數（'U'），
        // 畫面上就會把選位反白疊在「已訂」格子上，看起來很像 bug（實際送出訂單時後端會另外正確分配，
        // 這裡純粹是「畫面要反白哪一列」選錯，屬於視覺呈現問題）。
        const row = rowsInZone.find(r => {
          const assigned = rowAssignments.get(r.campsiteId) ?? [];
          const noOverlapWithOtherSelections = !assigned.some(
            a => a.checkIn < entry.checkOutDate && entry.checkInDate < a.checkOut
          );
          return noOverlapWithOtherSelections && this.isRowFullyAvailable(r, entry.checkInDate, entry.checkOutDate);
        });
        if (!row) return; // 沒有空列了（正常情況下 maxAvailableQuantity 已經會擋掉，不該發生）

        rowAssignments.get(row.campsiteId)!.push({ checkIn: entry.checkInDate, checkOut: entry.checkOutDate });

        const ranges = this.genericHighlightRanges.get(row.campsiteId) ?? [];
        ranges.push({ checkIn: entry.checkInDate, checkOut: entry.checkOutDate });
        this.genericHighlightRanges.set(row.campsiteId, ranges);
      });
    });
  }

  // 這一列在 [checkIn, checkOut) 這段期間，是否每一天的真實庫存狀態都是可訂（'A'）。
  // 只檢查目前甘特圖視窗內看得到的日期；範圍外（例如換頁後才看得到）的日期無法驗證，視為可通過，
  // 跟原本的行為一致（這只是「畫面要反白哪一列」的視覺挑選，不是實際訂位判斷）。
  private isRowFullyAvailable(row: GanttRowItem, checkIn: string, checkOut: string): boolean {
    return this.matrixDates.every((date, idx) => {
      if (date < checkIn || date >= checkOut) return true; // 不在這段期間內，不用檢查
      return this.cellStatus(row, idx) === 'A';
    });
  }

  ngAfterViewInit() {
    this.initZoneMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['campgroundId'] && !changes['campgroundId'].firstChange) {
      this.loadGantt();
    }
    if (changes['zones'] && this.zoneMapReady) {
      this.drawZones();
    }
  }

  private loadGantt() {
    this.loading = true;
    this.calendarService.getGantt(this.campgroundId, this.startDate, this.days).subscribe({
      next: res => {
        this.matrixDates = res.matrixDates;
        this.ganttRows = res.ganttRows;
        this.loading = false;
        this.recomputeGenericHighlights();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  prevWindow() {
    this.shiftWindow(-this.days);
  }

  nextWindow() {
    this.shiftWindow(this.days);
  }

  // 提供給外部呼叫（例如 Zone 詳細頁選完帶回時），把視窗跳到指定日期
  jumpToDate(dateStr: string) {
    this.startDate = dateStr;
    this.loadGantt();
  }

  // 工具列日期選擇器的處理：使用者挑一個日期就把甘特圖視窗跳過去，不用一直按「下 10 天」。
  // 選空值（例如清掉日期）不動作，避免把 startDate 設成空字串害 loadGantt 出錯。
  onPickDate(value: string) {
    if (value) {
      this.jumpToDate(value);
    }
  }

  private shiftWindow(deltaDays: number) {
    const d = new Date(this.startDate);
    d.setDate(d.getDate() + deltaDays);
    this.startDate = this.formatDate(d);
    this.loadGantt();
  }

  // 列名稱規則：Generic(1) 一律顯示 Zone 名稱，UniqueUnit(2) 顯示具體帳位編號
  rowLabel(row: GanttRowItem): string {
    return row.zoneType === 1 ? row.groupName : row.siteDisplayName;
  }

  private static readonly WEEKDAY_LABELS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

  // 日期表頭多顯示星期幾，方便對照日期
  // 不特別標色週六週日：平日/假日價格其實是依「週六日 或 國定假日」決定（見後端 PriceHelper），
  // 只標週六日顏色會誤導使用者以為國定假日（可能落在平日）不算假日價
  dayOfWeek(dateStr: string): string {
    return GanttCalendar.WEEKDAY_LABELS[new Date(dateStr).getDay()];
  }

  openInfo(row: GanttRowItem) {
    this.infoVisible = true;
    this.infoLoading = true;
    this.infoDetail = null;
    // 價格資料其實已經在 zones（CampMapZoneDto）裡，不用額外打 API
    this.infoPricing = this.zones.find(z => z.zoneId === row.zoneId) ?? null;

    this.calendarService.getZoneDetail(row.zoneId).subscribe({
      next: res => {
        // 照片路徑可能是完整外部網址（舊資料用 Unsplash）或後端本機上傳的相對路徑（/uploads/...，
        // 之後上架系統的圖都會是這種），相對路徑要補上後端網域，不然瀏覽器會拿前端網域去要，一定 404。
        this.infoDetail = { ...res, photoUrls: res.photoUrls.map(url => this.resolveImageUrl(url)) };
        this.infoLoading = false;
      },
      error: () => {
        this.infoLoading = false;
      },
    });
  }

  // 跟 camp-card.ts / camp-detail.ts / liked.ts 用同一套判斷邏輯
  private readonly apiHost = environment.apiUrl.replace('/api', '');
  private resolveImageUrl(imageUrl: string): string {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    if (imageUrl.startsWith('/')) return `${this.apiHost}${imageUrl}`;
    return imageUrl;
  }

  openLightbox(index: number) {
    this.lightboxIndex = index;
    this.showLightbox = true;
  }

  cellStatus(row: GanttRowItem, dateIndex: number): string {
    return row.dailyStatuses[dateIndex]?.status ?? 'U';
  }

  isSelected(row: GanttRowItem, dateIndex: number): boolean {
    const date = this.matrixDates[dateIndex];

    const direct = this.selections.some(
      s => s.displayRowCampsiteId === row.campsiteId && date >= s.checkInDate && date < s.checkOutDate
    );
    if (direct) return true;

    // Generic 選位視覺示意：這格被挑來代表某筆「沒有具體帳位」的選位
    const ranges = this.genericHighlightRanges.get(row.campsiteId);
    return ranges?.some(r => date >= r.checkIn && date < r.checkOut) ?? false;
  }

  isDragging(rowIndex: number, dateIndex: number): boolean {
    if (!this.drag || this.drag.rowIndex !== rowIndex) return false;
    const [from, to] = [this.drag.startDateIndex, this.drag.endDateIndex].sort((a, b) => a - b);
    return dateIndex >= from && dateIndex <= to;
  }

  // 入住日（範圍最前面那一格）：保留圓角+打勾，但用淺色——跟中間「真正住的那幾晚」的深色做區隔，
  // 頭尾淺、中間深，才會有「一個區間」的視覺感覺
  isRangeStart(row: GanttRowItem, dateIndex: number): boolean {
    return this.isSelected(row, dateIndex) && !this.isSelected(row, dateIndex - 1);
  }

  // 退房日：拖曳放開滑鼠的那一格直接就是退房日，不額外多畫一格。
  // 因為 checkOutDate 現在等於拖曳放開那天，isSelected() 的 [checkIn, checkOut) 判斷會自動排除這一格，
  // 不會被誤判成「住的那一晚」
  isCheckoutDay(row: GanttRowItem, dateIndex: number): boolean {
    const date = this.matrixDates[dateIndex];

    const direct = this.selections.some(s => s.displayRowCampsiteId === row.campsiteId && date === s.checkOutDate);
    if (direct) return true;

    const ranges = this.genericHighlightRanges.get(row.campsiteId);
    return ranges?.some(r => date === r.checkOut) ?? false;
  }

  // 取消按鈕放在退房格——現在退房格就是使用者拖曳放開滑鼠的那一格，鬆開在哪、按鈕就在哪。
  // 也要支援 Generic 從 Zone 細節頁選的那些（displayRowCampsiteId=0，靠 genericHighlightRanges
  // 反推這一列、這一天對應到哪一筆選位），不能只看「直接對應到真實列」的選位
  canRemoveAtCheckout(row: GanttRowItem, dateIndex: number): boolean {
    const date = this.matrixDates[dateIndex];
    const direct = this.selections.some(s => s.displayRowCampsiteId === row.campsiteId && date === s.checkOutDate);
    if (direct) return true;

    const ranges = this.genericHighlightRanges.get(row.campsiteId);
    return ranges?.some(r => date === r.checkOut) ?? false;
  }

  removeAtCheckout(row: GanttRowItem, dateIndex: number, event: Event) {
    event.stopPropagation();
    const date = this.matrixDates[dateIndex];

    const directEntry = this.selections.find(s => s.displayRowCampsiteId === row.campsiteId && date === s.checkOutDate);
    if (directEntry) {
      this.removeSelection(directEntry);
      return;
    }

    // Generic：genericHighlightRanges 只存日期，沒有保留是哪一筆選位，
    // 但 Generic 選位的 displayRowCampsiteId 固定是 0，靠 checkIn/checkOut 就能請 service 移除一筆相符的
    const ranges = this.genericHighlightRanges.get(row.campsiteId);
    const range = ranges?.find(r => date === r.checkOut);
    if (range) {
      this.campSelectionService.remove(0, range.checkIn, range.checkOut);
    }
  }

  // 後端「已訂/可訂」判斷只看有沒有真的被訂走，不管日期是不是已經過去——今天以前的日期沒被訂過
  // 一樣會回傳可訂('A')，所以過去日期要在前端另外擋，不能只靠 cellStatus。
  isPastDate(dateIndex: number): boolean {
    return this.matrixDates[dateIndex] < this.todayStr;
  }

  onCellMouseDown(rowIndex: number, dateIndex: number, row: GanttRowItem) {
    if (this.isPastDate(dateIndex)) return; // 今天以前不能選
    if (this.cellStatus(row, dateIndex) !== 'A') return;
    if (this.isSelected(row, dateIndex)) return; // 已選的格子不能拖，要先點掉移除
    this.drag = { rowIndex, startDateIndex: dateIndex, endDateIndex: dateIndex };
  }

  onCellMouseEnter(rowIndex: number, dateIndex: number, row: GanttRowItem) {
    if (!this.drag || this.drag.rowIndex !== rowIndex) return;
    if (this.isPastDate(dateIndex)) return; // 拖到過去日期就不延伸過去
    if (this.cellStatus(row, dateIndex) !== 'A') return; // 拖到不可訂的格子就不延伸過去
    this.drag.endDateIndex = dateIndex;
  }

  // 用 document 層級監聽，避免使用者拖到格子外面才放開滑鼠導致選取沒生效
  @HostListener('document:mouseup')
  onMouseUp() {
    if (!this.drag) return;
    const row = this.ganttRows[this.drag.rowIndex];

    const [fromIdx, toIdx] = [this.drag.startDateIndex, this.drag.endDateIndex].sort((a, b) => a - b);
    this.drag = null;

    // 退房日 = 拖曳放開滑鼠的那一格，不額外往後加一天：使用者拖到哪天，那天就是退房日，
    // 跟 isSelected() 的 [checkInDate, checkOutDate) 慣例完全相容——退房日本身不會被算進已選的晚數
    // 至少要拖 2 格（1 晚）才算有效選位，只點 1 格（入住=退房，0 晚）視為無效操作直接忽略
    if (toIdx <= fromIdx) return;

    const checkInDate = this.matrixDates[fromIdx];
    const checkOutDate = this.matrixDates[toIdx];

    const entry: CampSelectionEntry = {
      campsiteId: row.zoneType === 1 ? 0 : row.campsiteId, // Generic 一律送 0，UniqueUnit 送真實 id
      zoneId: row.zoneId,
      checkInDate,
      checkOutDate,
      displayRowCampsiteId: row.campsiteId, // 畫面高亮永遠用拖的那一列，跟送給後端的 campsiteId 無關
      displayName: this.rowLabel(row),
      zoneType: row.zoneType,
    };

    this.addOrMergeSelection(entry);
  }

  // 同一列如果有跟新選位「重疊或緊接著」的舊選位，合併成一筆連續的，不要疊成兩筆
  // （日期區間是 [checkInDate, checkOutDate) 不含結束日，緊接著代表 existing.checkOutDate === entry.checkInDate 之類的邊界情況）
  private addOrMergeSelection(entry: CampSelectionEntry) {
    const overlapping = this.selections.filter(
      s =>
        s.displayRowCampsiteId === entry.displayRowCampsiteId &&
        s.checkOutDate >= entry.checkInDate &&
        s.checkInDate <= entry.checkOutDate
    );

    overlapping.forEach(s => this.campSelectionService.remove(s.displayRowCampsiteId, s.checkInDate, s.checkOutDate));

    const allDates = [entry, ...overlapping];
    const mergedCheckIn = allDates.reduce((min, s) => (s.checkInDate < min ? s.checkInDate : min), entry.checkInDate);
    const mergedCheckOut = allDates.reduce((max, s) => (s.checkOutDate > max ? s.checkOutDate : max), entry.checkOutDate);

    this.campSelectionService.add({ ...entry, checkInDate: mergedCheckIn, checkOutDate: mergedCheckOut });
  }

  removeSelection(entry: CampSelectionEntry) {
    this.campSelectionService.remove(entry.displayRowCampsiteId, entry.checkInDate, entry.checkOutDate);
  }

  calculateTotal() {
    if (this.selections.length === 0) return;

    this.calculating = true;
    this.calendarService
      .getSummary({
        campgroundId: this.campgroundId,
        selectedCampsites: this.campSelectionService.toRequestItems(),
      })
      .subscribe({
        next: res => {
          this.orderSummary = res;
          this.calculating = false;
        },
        error: () => {
          this.calculating = false;
        },
      });
  }

  // F6 結帳頁尚未實作（目前是空殼），先把選位資料留在 CampSelectionService（root 服務，跨頁不會清空）
  // 等結帳頁做好後直接從那邊讀取即可，這裡先把入口接上
  // 按「前往結帳」先問要不要加購裝備，不直接跳頁
  goToCheckout() {
    this.showAddonPrompt = true;
  }

  // 要加購 → 導到同仁的裝備出租頁，選完/跳過後那邊會自動導回 /checkout
  // 裝備出租頁需要 checkIn/checkOut 算租用天數，不然會預設算 1 晚導致租金算錯。
  // 使用者可能選了好幾段不連續的日期，這裡取「最早入住日 ~ 最晚退房日」當整趟行程的範圍。
  confirmAddon() {
    this.showAddonPrompt = false;

    const checkInDates = this.selections.map(s => s.checkInDate);
    const checkOutDates = this.selections.map(s => s.checkOutDate);
    const checkIn = checkInDates.length ? checkInDates.reduce((a, b) => (a < b ? a : b)) : '';
    const checkOut = checkOutDates.length ? checkOutDates.reduce((a, b) => (a > b ? a : b)) : '';

    this.router.navigate(['/camp', this.campgroundId, 'rental'], {
      queryParams: { checkIn, checkOut },
    });
  }

  // 不需要裝備 → 直接進結帳頁
  skipAddon() {
    this.showAddonPrompt = false;
    this.router.navigate(['/checkout']);
  }

  // 不能用 date.toISOString()——會轉成 UTC（台灣 UTC+8，等於減 8 小時）可能跨到前一天，
  // 必須直接讀本地的年/月/日，不要經過時區轉換
  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private initZoneMap() {
    if (!this.zoneMapEl?.nativeElement) return;
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    this.zoneMap = L.map(this.zoneMapEl.nativeElement).setView([23.5, 121], 8);
    // 改用 Esri 衛星空拍圖（免費、不用 API key），這樣框出來的範圍能直接對照實際場地長相
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community' }
    ).addTo(this.zoneMap);

    this.zoneMapReady = true;
    if (this.zones.length) this.drawZones();
  }

  private drawZones() {
    if (!this.zoneMap) return;

    this.zoneLayers.forEach(layer => layer.remove());
    this.zoneLayers.clear();

    const allBounds: L.LatLngBounds[] = [];

    this.zones.forEach(zone => {
      let geo: any;
      try {
        geo = JSON.parse(zone.geoJson);
      } catch {
        return; // 這個 Zone 沒有合法的 GeoJSON，跳過不畫
      }

      const layer = L.geoJSON(geo, {
        style: () => this.zoneStyle(zone),
      })
        // permanent: true → 不用 hover，常駐顯示在色塊中間，選位數字才會「即時」看得到
        .bindTooltip(this.zoneTooltipHtml(zone), { permanent: true, direction: 'center', className: 'zone-tooltip' })
        .on('click', () => this.router.navigate(['/camp', this.campgroundId, 'zone', zone.zoneId]))
        .on('mouseover', () => this.setZoneHover(layer, zone, true))
        .on('mouseout', () => this.setZoneHover(layer, zone, false))
        .addTo(this.zoneMap!);

      this.zoneLayers.set(zone.zoneId, layer);
      allBounds.push(layer.getBounds());
    });

    if (allBounds.length) {
      const bounds = allBounds.reduce((acc, b) => acc.extend(b), allBounds[0]);
      this.zoneMap.fitBounds(bounds, { padding: [20, 20] });
    }
  }

  // 選位變動時只重畫樣式 + 更新常駐 Tooltip 內容，不重新抓 GeoJSON、不重設地圖視角
  private updateZoneLayers() {
    this.zoneLayers.forEach((layer, zoneId) => {
      const zone = this.zones.find(z => z.zoneId === zoneId);
      if (!zone) return;
      layer.setStyle(this.zoneStyle(zone));
      // permanent tooltip 要用 setTooltipContent 推新內容，重新 bindTooltip 不會自動刷新已開啟的內容
      layer.setTooltipContent(this.zoneTooltipHtml(zone));
    });
  }

  // hovering=true 時整片亮起來＋邊框變粗，模擬遊戲地圖「滑鼠移上去會反應」的感覺
  // 「能不能訂」完全交給甘特圖的 A/U 格子判斷，這裡不重複判斷「選滿」，只單純標示「有沒有選位」
  private zoneStyle(zone: CampMapZoneDto, hovering = false): L.PathOptions {
    const summary = this.campSelectionService.getZoneSummary(zone.zoneId);
    const baseColor = summary.count > 0 ? '#facc15' : '#38bdf8';

    return {
      color: baseColor,
      weight: hovering ? 4 : 2.5,
      fillColor: baseColor,
      fillOpacity: hovering ? 0.35 : summary.count > 0 ? 0.15 : 0,
      className: 'zone-shape',
    };
  }

  private setZoneHover(layer: L.GeoJSON, zone: CampMapZoneDto, hovering: boolean) {
    layer.setStyle(this.zoneStyle(zone, hovering));
    // L.GeoJSON 本身是一群圖層的集合（FeatureGroup），沒有 getElement()，
    // 要從底下實際的 Path 子圖層（每個 GeoJSON feature 對應一個）去拿 DOM 元素
    layer.eachLayer(child => {
      if (child instanceof L.Path) {
        child.getElement()?.classList.toggle('zone-shape--hover', hovering);
      }
    });
  }

  private zoneTypeIcon(zoneType: number): string {
    return zoneType === 1 ? TENT_ICON_SVG : HOME_ICON_SVG;
  }

  private zoneTooltipHtml(zone: CampMapZoneDto): string {
    const summary: ZoneSelectionSummary = this.campSelectionService.getZoneSummary(zone.zoneId);
    const icon = `<span class="zone-tooltip__icon">${this.zoneTypeIcon(zone.zoneType)}</span>`;

    if (summary.count === 0) {
      return `<span class="zone-tooltip__name">${icon}${zone.zoneName}</span>`;
    }

    const dateLine = summary.checkInDate
      ? `<span class="zone-tooltip__date">${summary.checkInDate} ~ ${summary.checkOutDate}</span>`
      : '';
    return `
      <span class="zone-tooltip__name">${icon}${zone.zoneName}</span>
      <span class="zone-tooltip__count">已選 ${summary.count} 格</span>
      ${dateLine}
    `;
  }
}
