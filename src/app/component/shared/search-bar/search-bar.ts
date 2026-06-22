import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { SearchService } from '../../../services/search.service';
import { CampSearchOption } from '../../../interfaces/camp.interface';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
  imports: [FormsModule, DatePickerModule, PopoverModule, ButtonModule],
})
export class SearchBar implements OnInit {
  area = '';
  dateRange: Date[] = [];
  today = new Date();

  selfOwnedOptions: CampSearchOption[] = [];   // category=1 自帶裝備
  noEquipmentOptions: CampSearchOption[] = []; // category=2 免裝備
  quantities: Record<number, number> = {};     // itemId -> 數量

  constructor(private router: Router, private searchService: SearchService) {}

  ngOnInit() {
    this.searchService.getOptions().subscribe(options => {
      this.selfOwnedOptions = options.filter(o => o.category === 1);
      this.noEquipmentOptions = options.filter(o => o.category === 2);
      options.forEach(o => this.quantities[o.id] = 0);
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
    const params: Record<string, any> = { sortBy: 'Recommended' };
    if (this.area) params['area'] = this.area;
    if (this.dateRange?.[0]) params['checkInDate'] = this.formatDate(this.dateRange[0]);
    if (this.dateRange?.[1]) params['checkOutDate'] = this.formatDate(this.dateRange[1]);

    const requirements = Object.entries(this.quantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ itemId: Number(id), quantity: qty }));

    if (requirements.length > 0) {
      params['requirements'] = JSON.stringify(requirements);
    }

    this.router.navigate(['/search'], { queryParams: params });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
