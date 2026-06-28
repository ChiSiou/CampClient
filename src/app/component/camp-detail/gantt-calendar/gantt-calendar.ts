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
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import * as L from 'leaflet';
import { CalendarService } from '../../../services/calendar.service';
import { CampSelectionService, CampSelectionEntry, ZoneSelectionSummary } from '../../../services/camp-selection.service';
import { GanttRowItem, CampOrderSummaryDto, CampMapZoneDto, CampZoneDetailDto } from '../../../interfaces/camp.interface';
import { TENT_ICON_SVG, HOME_ICON_SVG } from '../../../shared/map-icons';
import { Lightbox } from '../../shared/lightbox/lightbox';

interface DragState {
  rowIndex: number;
  startDateIndex: number;
  endDateIndex: number;
}

@Component({
  selector: 'app-gantt-calendar',
  imports: [NgClass, DialogModule, Lightbox],
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

  // 把所有「沒有具體帳位」的 Generic 選位，依 Zone+日期區間分組，
  // 各分組挑出該 Zone 底下前 N 個帳位列（N=該分組的選位數量），讓甘特圖左側也能反白示意
  private recomputeGenericHighlights() {
    this.genericHighlightRanges.clear();

    const groups = new Map<string, { zoneId: number; checkIn: string; checkOut: string; count: number }>();
    this.selections
      .filter(s => s.displayRowCampsiteId === 0 && s.zoneType === 1 && s.zoneId !== null)
      .forEach(s => {
        const zoneId = s.zoneId as number;
        const key = `${zoneId}|${s.checkInDate}|${s.checkOutDate}`;
        const g = groups.get(key);
        if (g) g.count++;
        else groups.set(key, { zoneId, checkIn: s.checkInDate, checkOut: s.checkOutDate, count: 1 });
      });

    groups.forEach(({ zoneId, checkIn, checkOut, count }) => {
      const rowsInZone = this.ganttRows.filter(r => r.zoneType === 1 && r.zoneId === zoneId);
      rowsInZone.slice(0, count).forEach(row => {
        const ranges = this.genericHighlightRanges.get(row.campsiteId) ?? [];
        ranges.push({ checkIn, checkOut });
        this.genericHighlightRanges.set(row.campsiteId, ranges);
      });
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

  openInfo(row: GanttRowItem) {
    this.infoVisible = true;
    this.infoLoading = true;
    this.infoDetail = null;
    // 價格資料其實已經在 zones（CampMapZoneDto）裡，不用額外打 API
    this.infoPricing = this.zones.find(z => z.zoneId === row.zoneId) ?? null;

    this.calendarService.getZoneDetail(row.zoneId).subscribe({
      next: res => {
        this.infoDetail = res;
        this.infoLoading = false;
      },
      error: () => {
        this.infoLoading = false;
      },
    });
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

  onCellMouseDown(rowIndex: number, dateIndex: number, row: GanttRowItem) {
    if (this.cellStatus(row, dateIndex) !== 'A') return;
    if (this.isSelected(row, dateIndex)) return; // 已選的格子不能拖，要先點掉移除
    this.drag = { rowIndex, startDateIndex: dateIndex, endDateIndex: dateIndex };
  }

  onCellMouseEnter(rowIndex: number, dateIndex: number, row: GanttRowItem) {
    if (!this.drag || this.drag.rowIndex !== rowIndex) return;
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

    // 退房日是區間結束後一天（checkOutDate 是「不含」的那一天，跟後端日期區間慣例一致）
    const checkInDate = this.matrixDates[fromIdx];
    const lastNightDate = new Date(this.matrixDates[toIdx]);
    lastNightDate.setDate(lastNightDate.getDate() + 1);
    const checkOutDate = this.formatDate(lastNightDate);

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

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
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
