import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderManagementService } from '../../../../services/order-management.service';
import {
  OrderOwnerDetailDto,
  OrderDetailItemDto,
  RefundResultDto,
} from '../../../../interfaces/order-management.interface';

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
})
export class OrderDetail implements OnInit {
  orderId!: number;
  order: OrderOwnerDetailDto | null = null;
  loading = true;
  error = '';

  cancelling = false;
  cancelError = '';
  refundResult: RefundResultDto | null = null;

  constructor(private route: ActivatedRoute, private orderService: OrderManagementService) {}

  ngOnInit() {
    this.orderId = +this.route.snapshot.paramMap.get('orderId')!;
    this.loadDetail();
  }

  loadDetail() {
    this.loading = true;
    this.orderService.getOrderDetail(this.orderId).subscribe({
      next: (data) => { this.order = data; this.loading = false; },
      error: () => { this.error = '載入失敗'; this.loading = false; },
    });
  }

  submitCancel() {
    const allPaidIds = (this.order?.details ?? [])
      .filter(d => d.status === 1)
      .map(d => d.orderDetailId);
    if (allPaidIds.length === 0) { this.cancelError = '沒有可退款的項目'; return; }
    if (!confirm('確定要取消整筆訂單並退款？送出後立即執行，無法撤回。')) return;
    this.cancelling = true;
    this.cancelError = '';
    this.orderService.cancelOrder(this.orderId, { orderDetailIds: allPaidIds }).subscribe({
      next: (result) => {
        this.refundResult = result;
        this.cancelling = false;
        this.loadDetail();
      },
      error: (err) => {
        this.cancelError = err.error?.message ?? '退款申請失敗';
        this.cancelling = false;
      },
    });
  }

  get totalAmount(): number {
    return this.order?.details.reduce((sum, d) => sum + d.price, 0) ?? 0;
  }

  statusLabel(status: number): string {
    const map: Record<number, string> = { 0: '待付款', 1: '已付款', 2: '已取消', 3: '申訴中' };
    return map[status] ?? '未知';
  }

  statusClass(status: number): string {
    const map: Record<number, string> = { 0: 'pending', 1: 'paid', 2: 'cancelled', 3: 'dispute' };
    return map[status] ?? '';
  }

  detailStatusLabel(status: number): string {
    const map: Record<number, string> = { 1: '已付款', 2: '已退款', 3: '退款審核中' };
    return map[status] ?? '未知';
  }

  detailStatusClass(status: number): string {
    const map: Record<number, string> = { 1: 'paid', 2: 'refunded', 3: 'reviewing' };
    return map[status] ?? '';
  }

  logActionLabel(action: string): string {
    const map: Record<string, string> = { 'Payment': '付款', 'Refund': '退款' };
    return map[action] ?? action;
  }
}
