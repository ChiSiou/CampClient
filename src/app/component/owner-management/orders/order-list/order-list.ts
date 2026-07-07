import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderManagementService } from '../../../../services/order-management.service';
import { OrderListItemDto } from '../../../../interfaces/order-management.interface';

@Component({
  selector: 'app-order-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css',
})
export class OrderList implements OnInit {
  orders: OrderListItemDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  loading = false;

  filterStatus: number | null = null;
  filterKeyword = '';
  filterCheckInFrom = '';
  filterCheckInTo = '';

  constructor(private orderService: OrderManagementService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.orderService.listOrders({
      status: this.filterStatus,
      keyword: this.filterKeyword || undefined,
      checkInFrom: this.filterCheckInFrom || undefined,
      checkInTo: this.filterCheckInTo || undefined,
      page: this.page,
      pageSize: this.pageSize,
    }).subscribe({
      next: (res) => {
        this.orders = res.items;
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  search() {
    this.page = 1;
    this.load();
  }

  reset() {
    this.filterStatus = null;
    this.filterKeyword = '';
    this.filterCheckInFrom = '';
    this.filterCheckInTo = '';
    this.page = 1;
    this.load();
  }

  prevPage() { if (this.page > 1) { this.page--; this.load(); } }
  nextPage() { if (this.page * this.pageSize < this.totalCount) { this.page++; this.load(); } }

  get totalPages() { return Math.ceil(this.totalCount / this.pageSize); }

  statusLabel(status: number): string {
    const map: Record<number, string> = { 0: '待付款', 1: '已付款', 2: '已取消', 3: '申訴中' };
    return map[status] ?? '未知';
  }

  statusClass(status: number): string {
    const map: Record<number, string> = { 0: 'pending', 1: 'paid', 2: 'cancelled', 3: 'dispute' };
    return map[status] ?? '';
  }
}
