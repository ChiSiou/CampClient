import { Component, OnInit } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { forkJoin } from 'rxjs';
import { CalendarService } from '../../../services/calendar.service';
import { CampSelectionService, CampSelectionEntry } from '../../../services/camp-selection.service';
import { CampZoneCalendarDto, CampZoneDetailDto, UnitCard } from '../../../interfaces/camp.interface';
import { Lightbox } from '../../shared/lightbox/lightbox';

@Component({
  selector: 'app-zone-detail',
  imports: [DecimalPipe, NgClass, FormsModule, DatePickerModule, DialogModule, Lightbox],
  templateUrl: './zone-detail.html',
  styleUrl: './zone-detail.css',
})
export class ZoneDetail implements OnInit {
  campgroundId = 0;
  zoneId = 0;
  calendar: CampZoneCalendarDto | null = null;
  zoneDetail: CampZoneDetailDto | null = null;
  loading = true;

  dateRange: Date[] = [];
  today = new Date();

  // Generic：使用者想訂幾帳
  quantity = 1;

  // UniqueUnit：使用者選了哪些 campsiteId
  selectedUnitIds = new Set<number>();

  submitting = false;
  errorMessage = '';

  // Zone 介紹照片格宮的 Lightbox
  showZoneLightbox = false;
  zoneLightboxIndex = 0;

  // 小木屋「查看詳情」彈窗
  detailUnit: UnitCard | null = null;
  detailVisible = false;
  showUnitLightbox = false;
  unitLightboxIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private calendarService: CalendarService,
    private campSelectionService: CampSelectionService,
  ) {}

  ngOnInit() {
    this.campgroundId = Number(this.route.snapshot.paramMap.get('id'));
    this.zoneId = Number(this.route.snapshot.paramMap.get('zoneId'));
    this.loadCalendar();
    this.calendarService.getZoneDetail(this.zoneId).subscribe({
      next: res => (this.zoneDetail = res),
      error: () => {},
    });
  }

  openZoneLightbox(index: number) {
    this.zoneLightboxIndex = index;
    this.showZoneLightbox = true;
  }

  openUnitDetail(unit: UnitCard, event: Event) {
    event.stopPropagation();
    this.detailUnit = unit;
    this.detailVisible = true;
  }

  openUnitLightbox(index: number) {
    this.unitLightboxIndex = index;
    this.showUnitLightbox = true;
  }

  toggleDetailUnit() {
    if (!this.detailUnit) return;
    this.toggleUnit(this.detailUnit);
  }

  private loadCalendar() {
    this.loading = true;
    const [checkIn, checkOut] = this.dateRange;
    this.calendarService
      .getZoneCalendar(this.zoneId, checkIn && this.formatDate(checkIn), checkOut && this.formatDate(checkOut))
      .subscribe({
        next: res => {
          this.calendar = res;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  // 日期選完（兩端都有值）才重新打 API 取得正確的可訂狀態/價格
  onDateRangeChange() {
    if (this.dateRange?.[0] && this.dateRange?.[1]) {
      this.quantity = 1;
      this.selectedUnitIds.clear();
      this.errorMessage = '';
      this.loadCalendar();
    }
  }

  get hasDateRange(): boolean {
    return !!(this.dateRange?.[0] && this.dateRange?.[1]);
  }

  // 衛浴是訂房決策的關鍵資訊，不該跟其他備品（棉被、吹風機）平等地埋在標籤列裡，
  // 卡片本身就要先讓使用者看到，不用點進詳情
  hasBathroom(unit: UnitCard): boolean {
    return unit.facilities?.some(f => f.facilityName.includes('衛浴')) ?? false;
  }

  // Generic：逐天比對「後端剩餘量」扣掉「同一天已經在選位清單裡的數量」，取整段期間最小值
  // 不能只比對「日期完全相同」——兩次選位日期重疊但不完全一樣（例如 6/30~7/3 跟 6/30~7/2）
  // 還是會搶到同一批實體帳位，要逐天檢查才能真正擋住重疊的情況
  get maxAvailableQuantity(): number {
    if (!this.calendar?.dailySummaries?.length) return 0;
    return Math.min(
      ...this.calendar.dailySummaries.map(d => Math.max(0, d.remainingSites - this.alreadySelectedCountOnDate(d.date)))
    );
  }

  // 這段日期範圍裡，衝突最嚴重的那一天已經選了多少帳（純前端累積中、還沒送出訂單）
  get alreadySelectedQuantity(): number {
    if (!this.calendar?.dailySummaries?.length) return 0;
    return Math.max(0, ...this.calendar.dailySummaries.map(d => this.alreadySelectedCountOnDate(d.date)));
  }

  private alreadySelectedCountOnDate(date: string): number {
    return this.campSelectionService.current.filter(
      s => s.zoneId === this.zoneId && s.zoneType === 1 && date >= s.checkInDate && date < s.checkOutDate
    ).length;
  }

  // 每日清單顯示的「剩餘量」也要扣掉已選數量，不然會跟上面「最多還能再訂 X 帳」的提示對不起來
  adjustedRemaining(date: string, rawRemaining: number): number {
    return Math.max(0, rawRemaining - this.alreadySelectedCountOnDate(date));
  }

  adjustQuantity(delta: 1 | -1) {
    const next = this.quantity + delta;
    if (next < 1 || next > this.maxAvailableQuantity) return;
    this.quantity = next;
  }

  // unit.isAvailable 只看後端資料庫真實庫存，不知道使用者已經在甘特圖「直接拖曳」或這個 Zone 頁面
  // 其他小木屋選過、還沒送出訂單的同一個 campsiteId——要自己比對前端選位清單，日期重疊就不能再選
  isAlreadyBookedElsewhere(unit: UnitCard): boolean {
    if (!this.hasDateRange) return false;
    const checkInDate = this.formatDate(this.dateRange[0]);
    const checkOutDate = this.formatDate(this.dateRange[1]);
    return this.campSelectionService.current.some(
      s =>
        s.campsiteId === unit.campsiteId &&
        s.checkInDate < checkOutDate &&
        checkInDate < s.checkOutDate
    );
  }

  toggleUnit(unit: UnitCard) {
    if (!unit.isAvailable) return;
    if (this.isAlreadyBookedElsewhere(unit)) return;
    if (this.selectedUnitIds.has(unit.campsiteId)) {
      this.selectedUnitIds.delete(unit.campsiteId);
    } else {
      this.selectedUnitIds.add(unit.campsiteId);
    }
  }

  isUnitSelected(unit: UnitCard): boolean {
    return this.selectedUnitIds.has(unit.campsiteId);
  }

  get selectedUnits(): UnitCard[] {
    return this.calendar?.units?.filter(u => this.selectedUnitIds.has(u.campsiteId)) ?? [];
  }

  get canConfirm(): boolean {
    if (!this.hasDateRange) return false;
    if (this.calendar?.zoneType === 1) return this.quantity > 0 && this.maxAvailableQuantity > 0;
    return this.selectedUnitIds.size > 0;
  }

  confirm() {
    if (!this.canConfirm || !this.calendar) return;
    const checkInDate = this.formatDate(this.dateRange[0]);
    const checkOutDate = this.formatDate(this.dateRange[1]);

    this.submitting = true;
    this.errorMessage = '';

    if (this.calendar.zoneType === 1) {
      this.calendarService
        .getGenericZoneSummary({ zoneId: this.zoneId, quantity: this.quantity, checkInDate, checkOutDate })
        .subscribe({
          next: res => {
            // Generic 帳位由後端下訂時才正式分配，這裡先用 0 佔位，
            // 甘特圖左側不會特定高亮某一列，但右側 Zone 地圖計數會正確累加（依 zoneId 比對）
            const entries: CampSelectionEntry[] = res.items.map(() => ({
              campsiteId: 0,
              zoneId: this.zoneId,
              checkInDate,
              checkOutDate,
              displayRowCampsiteId: 0,
              displayName: res.zoneName,
              zoneType: 1,
            }));
            this.campSelectionService.addMany(entries);
            this.submitting = false;
            this.backToGantt();
          },
          error: () => {
            this.submitting = false;
            this.errorMessage = '送出失敗，請稍後再試。';
          },
        });
    } else {
      const requests = this.selectedUnits.map(unit =>
        this.calendarService.getUnitZoneSummary({ campsiteId: unit.campsiteId, checkInDate, checkOutDate })
      );

      // 同時送出每一間小木屋的摘要查詢，全部成功才送回甘特圖
      forkJoin(requests).subscribe({
        next: results => {
          const entries: CampSelectionEntry[] = results.map(r => {
            const item = r.items[0];
            return {
              campsiteId: item.campsiteId,
              zoneId: this.zoneId,
              checkInDate,
              checkOutDate,
              displayRowCampsiteId: item.campsiteId,
              displayName: item.siteNumber,
              zoneType: 2,
            };
          });
          this.campSelectionService.addMany(entries);
          this.submitting = false;
          this.backToGantt();
        },
        error: () => {
          this.submitting = false;
          this.errorMessage = '送出失敗，請稍後再試。';
        },
      });
    }
  }

  back() {
    this.router.navigate(['/camp', this.campgroundId]);
  }

  private backToGantt() {
    this.router.navigate(['/camp', this.campgroundId]);
  }

  // 不能用 date.toISOString()——p-datepicker 給的是「本地時間」午夜的 Date，
  // toISOString() 會轉成 UTC（台灣 UTC+8，等於減 8 小時），可能跨到前一天，
  // 必須直接讀本地的年/月/日，不要經過時區轉換
  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
