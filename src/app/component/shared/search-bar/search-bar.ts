import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { SearchService } from '../../../services/search.service';
import { CampSearchOption, RequirementItem } from '../../../interfaces/camp.interface';

export interface SearchBarInitial {
  area?: string;
  checkInDate?: string;
  checkOutDate?: string;
  requirements?: RequirementItem[];
}

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
  imports: [FormsModule, DatePickerModule, PopoverModule, ButtonModule],
})
export class SearchBar implements OnInit {
  @Input() initial?: SearchBarInitial;
  @Input() compact = false;

  area = '';
  dateRange: Date[] = [];
  today = new Date();

  selfOwnedOptions: CampSearchOption[] = [];   // category=1 自帶裝備
  noEquipmentOptions: CampSearchOption[] = []; // category=2 免裝備
  quantities: Record<number, number> = {};     // itemId -> 數量

  constructor(private router: Router, private searchService: SearchService) {}

  ngOnInit() {
    if (this.initial?.area) this.area = this.initial.area;
    if (this.initial?.checkInDate && this.initial?.checkOutDate) {
      this.dateRange = [new Date(this.initial.checkInDate), new Date(this.initial.checkOutDate)];
    }

    this.searchService.getOptions().subscribe(options => {
      this.selfOwnedOptions = options.filter(o => o.category === 1);
      this.noEquipmentOptions = options.filter(o => o.category === 2);
      options.forEach(o => this.quantities[o.id] = 0);

      this.initial?.requirements?.forEach(r => {
        this.quantities[r.itemId] = r.quantity;
      });
    });
  }

  get guestLabel(): string {
    const parts = Object.entries(this.quantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const all = [...this.selfOwnedOptions, ...this.noEquipmentOptions];
        const opt = all.find(o => o.id === Number(id));
        return opt ? `${opt.itemName} ${qty}` : '';
      })
      .filter(s => s);
    return parts.length ? parts.join('・') : '新增需求';
  }

  adjust(id: number, delta: 1 | -1) {
    this.quantities[id] = Math.max(0, (this.quantities[id] ?? 0) + delta);
  }

  search() {
    const params: Record<string, any> = { pageNumber: 1 };
    params['area'] = this.area || null;
    params['checkInDate'] = this.dateRange?.[0] ? this.formatDate(this.dateRange[0]) : null;
    params['checkOutDate'] = this.dateRange?.[1] ? this.formatDate(this.dateRange[1]) : null;

    const requirements = Object.entries(this.quantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ itemId: Number(id), quantity: qty }));

    // 數量歸零時要明確傳 null，merge 模式才會清掉網址上舊的 requirements
    params['requirements'] = requirements.length > 0 ? JSON.stringify(requirements) : null;

    this.router.navigate(['/search'], { queryParams: params, queryParamsHandling: 'merge' });
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
