import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CampsiteSelectionItem } from '../interfaces/camp.interface';

// 比後端 CampsiteSelectionItem 多兩個「純前端顯示用」欄位，這兩個欄位永遠不會送進 API
export interface CampSelectionEntry extends CampsiteSelectionItem {
  // 甘特圖要高亮哪一列：UniqueUnit 一定等於 campsiteId；Generic 是前端從可訂列裡暫定挑的，
  // 跟送給後端的 campsiteId（永遠是 0）無關，純粹決定畫面要亮哪一格
  displayRowCampsiteId: number;
  // 列名稱：Generic 顯示 Zone 名稱（同一 Zone 底下全部一樣），UniqueUnit 顯示具體帳位編號
  displayName: string;
  zoneType: number; // 1=Generic, 2=UniqueUnit，渲染/分組判斷用
}

export interface ZoneSelectionSummary {
  count: number;
  // 該 Zone 目前選位全部日期一致才會有值，分次選了不同區間就回 null（避免顯示誤導使用者連住整段）
  checkInDate: string | null;
  checkOutDate: string | null;
}

// 跟 sessionStorage 同步的內部結構：選位清單 + 所屬營區 id 一起存，缺一不可
interface PersistedState {
  campgroundId: number | null;
  entries: CampSelectionEntry[];
}

const STORAGE_KEY = 'campSelection';

// 累積使用者跨多次「直接拖甘特圖」/「進 Zone 詳細頁選位」的選位清單
// 用 providedIn: 'root'，在 /camp/:id 和 /camp/:id/zone/:zoneId 之間切換路由時不會被銷毀
//
// 額外存進 sessionStorage（不只是記憶體）：使用者送出訂單後，瀏覽器會整頁跳轉去綠界付款頁，
// 這個過程會離開我們的 SPA，純記憶體的 BehaviorSubject 狀態就會被清空。如果付款中途失敗
// （網路問題/使用者取消/綠界問題），使用者從綠界返回時，選位資料要還在，才能讓 /checkout
// 重新顯示「你有一筆待付款訂單」，呼叫後端既有的「沿用舊訂單重新出付款表單」機制，
// 不用乾等 15 分鐘背景排程才能重試。
@Injectable({ providedIn: 'root' })
export class CampSelectionService {
  private currentCampgroundId: number | null = null;
  private selections$: BehaviorSubject<CampSelectionEntry[]>;
  readonly selections: Observable<CampSelectionEntry[]>;

  constructor() {
    const persisted = this.loadFromStorage();
    this.currentCampgroundId = persisted.campgroundId;
    this.selections$ = new BehaviorSubject<CampSelectionEntry[]>(persisted.entries);
    this.selections = this.selections$.asObservable();
  }

  get current(): CampSelectionEntry[] {
    return this.selections$.value;
  }

  // 結帳頁需要知道目前選位是哪個營區的，才能呼叫 /Checkout/summary
  get campgroundId(): number | null {
    return this.currentCampgroundId;
  }

  // 進入 camp-detail 頁面時呼叫：如果跟上次是不同營區，先清空舊選位
  setCampground(campgroundId: number) {
    if (this.currentCampgroundId !== null && this.currentCampgroundId !== campgroundId) {
      this.clear();
    }
    this.currentCampgroundId = campgroundId;
    this.persist();
  }

  add(entry: CampSelectionEntry) {
    this.selections$.next([...this.current, entry]);
    this.persist();
  }

  addMany(entries: CampSelectionEntry[]) {
    this.selections$.next([...this.current, ...entries]);
    this.persist();
  }

  // 用顯示列 id + 日期區間移除一筆（甘特圖點掉已選格子、或摘要清單按刪除時用）
  // 只刪「第一筆」符合的，不要用 filter 整批刪掉——Generic 選位常常會有好幾筆
  // displayRowCampsiteId（=0）+ 日期完全相同（同一次在 Zone 細節頁選了多帳），
  // 摘要清單按掉其中一筆時不該把同樣條件的其他筆也一起清掉
  remove(displayRowCampsiteId: number, checkInDate: string, checkOutDate: string) {
    const index = this.current.findIndex(
      s =>
        s.displayRowCampsiteId === displayRowCampsiteId &&
        s.checkInDate === checkInDate &&
        s.checkOutDate === checkOutDate
    );
    if (index === -1) return;

    const next = [...this.current];
    next.splice(index, 1);
    this.selections$.next(next);
    this.persist();
  }

  clear() {
    this.selections$.next([]);
    this.persist();
  }

  // 給 CalendarService.getSummary() / 下訂用：轉成後端真正認得的格式
  // Generic 的 campsiteId 在 add 進來的時候就已經強制是 0，這裡單純去掉前端專用欄位
  toRequestItems(): CampsiteSelectionItem[] {
    return this.current.map(({ campsiteId, zoneId, checkInDate, checkOutDate }) => ({
      campsiteId,
      zoneId,
      checkInDate,
      checkOutDate,
    }));
  }

  // 給 Zone 互動地圖用：該 Zone 目前選了幾格、日期是否一致
  getZoneSummary(zoneId: number): ZoneSelectionSummary {
    const items = this.current.filter(s => s.zoneId === zoneId);
    if (items.length === 0) {
      return { count: 0, checkInDate: null, checkOutDate: null };
    }

    const sameDate = items.every(
      i => i.checkInDate === items[0].checkInDate && i.checkOutDate === items[0].checkOutDate
    );

    return {
      count: items.length,
      checkInDate: sameDate ? items[0].checkInDate : null,
      checkOutDate: sameDate ? items[0].checkOutDate : null,
    };
  }

  private persist() {
    const state: PersistedState = {
      campgroundId: this.currentCampgroundId,
      entries: this.current,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private loadFromStorage(): PersistedState {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { campgroundId: null, entries: [] };

    try {
      return JSON.parse(raw) as PersistedState;
    } catch {
      return { campgroundId: null, entries: [] };
    }
  }
}
