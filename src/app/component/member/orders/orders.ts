import { Message } from 'primeng/message';
import { Component } from '@angular/core';
import { MemberService } from '../Service/member-service';
import { OrderList } from '../interface/orderList';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'orders',
  imports: [DatePipe, NgClass, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  constructor(private memberservice: MemberService) {}
  orders: OrderList[] = [];
  displayCount = 5;
  currentPage = 1;

  ngOnInit() {
    this.memberservice.getorder().subscribe({
      next: (res) => {
        this.orders = res;
        console.log('response', res);
      },
      error: (err) => {
        console.log('error', err.Message);
      },
    });
  }
  activeTab: number | 'all' = 'all';

  setActiveTab(status: number | 'all') {
    this.activeTab = status;
    this.currentPage = 1;
  }

  get filteredOrders() {
    if (this.activeTab === 'all') {
      return this.orders;
    }

    return this.orders.filter((x) => x.status === this.activeTab);
  }

  get displayedOrders() {
    const start = (this.currentPage - 1) * this.normalizedDisplayCount;
    const end = start + this.normalizedDisplayCount;

    return this.filteredOrders.slice(start, end);
  }

  get normalizedDisplayCount() {
    const count = Number(this.displayCount);

    if (!Number.isFinite(count) || count < 1) {
      return 1;
    }

    return Math.floor(count);
  }

  get totalFilteredCount() {
    return this.filteredOrders.length;
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.totalFilteredCount / this.normalizedDisplayCount));
  }

  get pageStartItem() {
    if (this.totalFilteredCount === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.normalizedDisplayCount + 1;
  }

  get pageEndItem() {
    return Math.min(this.currentPage * this.normalizedDisplayCount, this.totalFilteredCount);
  }

  onDisplayCountChange() {
    this.displayCount = this.normalizedDisplayCount;
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  orderStatusMap: { [key: number]: string } = {
    0: '待付款',
    1: '已付款',
    2: '已取消',
    3: '申訴中',
  };
  getOrderStatusClass(status: number): string {
    switch (status) {
      case 0:
        return 'pending';
      case 1:
        return 'paid';
      case 2:
        return 'cancelled';
      case 3:
        return 'appeal';
      default:
        return 'unknown';
    }
  }
  getOrderStatusText(status: number): string {
    return this.orderStatusMap[status] ?? '未知狀態';
  }
}
