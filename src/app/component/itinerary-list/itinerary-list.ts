import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MemberService } from '../member/Service/member-service';
import { OrderDetail, OrderList } from '../member/interface/orderList';
import { PaymentService } from '../../services/payment.service';
import { RefundResultDto } from '../../interfaces/camp.interface';
import { environment } from '../../../environments/environment';

interface ItineraryItem {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  status: number;
  campId: number;
  campName: string;
  campImageUrl: string;
  checkinDate: string;
  checkoutDate: string;
  nights: number;
  accomTypes: string[];
  details: OrderDetail[];
  tripStatus: 'upcoming' | 'current' | 'past';
}

@Component({
  selector: 'app-itinerary-list',
  imports: [DatePipe, NgClass, RouterLink, CommonModule],
  templateUrl: './itinerary-list.html',
  styleUrl: './itinerary-list.css',
})
export class ItineraryList implements OnInit {
  itineraries: ItineraryItem[] = [];
  loading = true;
  errorMessage = '';
  private readonly apiHost = environment.apiUrl.replace('/api', '');

  // ===== 退款申請（行程卡內展開式面板）=====
  // 一張訂單可能拆成多個行程卡（多營區），用 orderId-campId 當唯一 key 記住展開的是哪一張
  refundItemKey: string | null = null;
  refundSelectedIds = new Set<number>();
  refundCalc: RefundResultDto | null = null;
  refundLoading = false;
  refundError = '';
  refundDoneMessage = '';

  constructor(
    private memberService: MemberService,
    private paymentService: PaymentService,
  ) {}

  ngOnInit() {
    this.loadItineraries();
  }

  get totalUpcomingPaidCount(): number {
    return this.itineraries.length;
  }

  private loadItineraries() {
    this.loading = true;
    this.errorMessage = '';

    this.memberService.getorder().subscribe({
      next: (orders) => {
        this.itineraries = orders
          .filter((order) => this.isPaidOrder(order))
          .flatMap((order) => this.toItineraryItems(order))
          .filter((item) => item.tripStatus === 'upcoming')
          .sort((a, b) => this.toDateTime(a.checkinDate) - this.toDateTime(b.checkinDate));
        this.loading = false;
      },
      error: () => {
        this.errorMessage = '行程資料載入失敗，請稍後再試。';
        this.loading = false;
      },
    });
  }

  private isPaidOrder(order: OrderList): boolean {
    return order.status === 1 && order.details.some((detail) => this.isCampDetail(detail));
  }

  private toItineraryItems(order: OrderList): ItineraryItem[] {
    const detailsByCamp = new Map<number, OrderDetail[]>();

    for (const detail of order.details) {
      if (!this.isCampDetail(detail)) {
        continue;
      }

      const details = detailsByCamp.get(detail.campId) ?? [];
      details.push(detail);
      detailsByCamp.set(detail.campId, details);
    }

    return Array.from(detailsByCamp.values()).map((details) => {
      const first = details[0];
      const checkinDate = details
        .map((detail) => detail.checkinDate)
        .sort((a, b) => this.toDateTime(a) - this.toDateTime(b))[0];
      const checkoutDate = details
        .map((detail) => detail.checkoutDate)
        .sort((a, b) => this.toDateTime(b) - this.toDateTime(a))[0];
      const accomTypes = Array.from(
        new Set(details.map((detail) => detail.accomType).filter(Boolean)),
      );

      return {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        totalAmount: details.reduce((sum, detail) => sum + (detail.totalAmount ?? 0), 0),
        status: order.status,
        campId: first.campId!,
        campName: first.campName,
        campImageUrl: first.campImageUrl,
        checkinDate,
        checkoutDate,
        nights: this.getNightCount(checkinDate, checkoutDate),
        accomTypes,
        details,
        tripStatus: this.getTripStatus(checkinDate, checkoutDate),
      };
    });
  }

  private isCampDetail(detail: OrderDetail): detail is OrderDetail & { campId: number } {
    return detail.itemType === 'camp' && typeof detail.campId === 'number';
  }

  private getTripStatus(
    checkinDate: string,
    checkoutDate: string,
  ): 'upcoming' | 'current' | 'past' {
    const today = this.startOfToday().getTime();
    const checkin = this.startOfDate(checkinDate).getTime();
    const checkout = this.startOfDate(checkoutDate).getTime();

    if (today < checkin) {
      return 'upcoming';
    }

    if (today >= checkout) {
      return 'past';
    }

    return 'current';
  }

  private getNightCount(checkinDate: string, checkoutDate: string): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const diff = this.startOfDate(checkoutDate).getTime() - this.startOfDate(checkinDate).getTime();

    return Math.max(1, Math.round(diff / oneDay));
  }

  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private startOfDate(value: string): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private toDateTime(value: string): number {
    return this.startOfDate(value).getTime();
  }

  getTripStatusText(status: ItineraryItem['tripStatus']): string {
    switch (status) {
      case 'upcoming':
        return '即將出發';
      case 'current':
        return '旅程中';
      case 'past':
        return '已完成';
    }
  }

  getTripStatusClass(status: ItineraryItem['tripStatus']): string {
    return status;
  }

  resolveImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return 'assets/placeholder.jpg';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    if (imageUrl.startsWith('/')) return `${this.apiHost}${imageUrl}`;
    return imageUrl;
  }

  // ===== 退款申請 =====

  itemKey(item: ItineraryItem): string {
    return `${item.orderId}-${item.campId}`;
  }

  // 展開/收合這張行程卡的退款面板。展開時預設把這張卡的明細全部勾選、清掉上次的試算/訊息。
  toggleRefundPanel(item: ItineraryItem) {
    const key = this.itemKey(item);
    if (this.refundItemKey === key) {
      this.refundItemKey = null;
      return;
    }
    this.refundItemKey = key;
    this.refundSelectedIds = new Set(item.details.map((d) => d.orderDetailId));
    this.refundCalc = null;
    this.refundError = '';
    this.refundDoneMessage = '';
  }

  isRefundItemChecked(orderDetailId: number): boolean {
    return this.refundSelectedIds.has(orderDetailId);
  }

  // 勾選變動就把舊的試算作廢（金額會變，要重新試算）
  toggleRefundItem(orderDetailId: number) {
    if (this.refundSelectedIds.has(orderDetailId)) {
      this.refundSelectedIds.delete(orderDetailId);
    } else {
      this.refundSelectedIds.add(orderDetailId);
    }
    this.refundCalc = null;
  }

  // 試算可退金額（不動 DB）
  calcRefund(item: ItineraryItem) {
    if (this.refundSelectedIds.size === 0) {
      this.refundError = '請至少勾選一個要退款的項目。';
      return;
    }
    this.refundLoading = true;
    this.refundError = '';
    this.refundDoneMessage = '';

    this.paymentService
      .calculateRefund({ orderId: item.orderId, orderDetailIds: [...this.refundSelectedIds] })
      .subscribe({
        next: (res) => {
          this.refundLoading = false;
          this.refundCalc = res;
        },
        error: () => {
          this.refundLoading = false;
          this.refundError = '試算失敗，請稍後再試。';
        },
      });
  }

  // 確認送出退款。成功後重新載入行程（全退的訂單會因為狀態變成已退款而從「即將到來」清單消失）
  submitRefund(item: ItineraryItem) {
    if (!this.refundCalc || this.refundSelectedIds.size === 0) return;
    this.refundLoading = true;
    this.refundError = '';

    this.paymentService
      .submitRefund({ orderId: item.orderId, orderDetailIds: [...this.refundSelectedIds] })
      .subscribe({
        next: (res) => {
          this.refundLoading = false;
          this.refundDoneMessage = res.message;
          this.refundCalc = null;
          this.refundSelectedIds.clear();
        },
        error: () => {
          this.refundLoading = false;
          this.refundError = '退款送出失敗，請稍後再試。';
        },
      });
  }
}
