import { Component, Input } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MemberService } from '../Service/member-service';
import { OrderList, OrderDetail } from '../interface/orderList';
import { CheckoutService } from '../../../services/checkout.service';
import { ExplorationService } from '../../../services/exploration.service';
import { CampSearchResultDto } from '../../../interfaces/camp.interface';
import { CampCard } from '../../shared/camp-card/camp-card';
import { ChatService } from '../../../services/chat.service';
import { Popup } from '../../reviews/popup/popup';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'orders',
  imports: [DatePipe, NgClass, FormsModule, RouterLink, CampCard, Popup],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  @Input() camp!: CampSearchResultDto;

  orders: OrderList[] = [];
  popularCamps: CampSearchResultDto[] = [];
  loadingPopularCamps = false;
  displayCount = 5;
  currentPage = 1;
  processingOrderId: number | null = null;
  pendingActionError = '';
  activeTab: number | 'all' = 'all';
  expandedOrderId: number | null = null;
  private readonly apiHost = environment.apiUrl.replace('/api', '');

  orderStatusMap: { [key: number]: string } = {
    0: '待付款',
    1: '已付款',
    2: '已取消',
    3: '申訴中',
    4: '已完成',
    5: '已退款',
  };

  constructor(
    private memberservice: MemberService,
    private checkoutService: CheckoutService,
    private explorationService: ExplorationService,
    private chatService: ChatService,
  ) {}

  ngOnInit() {
    this.loadPopularCamps();

    this.memberservice.getorder().subscribe({
      next: (res) => {
        this.orders = res;
      },
      error: (err) => {
        console.log('error', err?.message ?? err);
      },
    });
  }

  contactOwner(detail: OrderDetail) {
    if (detail.ownerId && detail.ownerName) {
      // this.chatService.openChatWith(detail.ownerId, detail.ownerName);
      this.chatService.openChatWith(detail.ownerId, detail.campName, detail.campImageUrl);
    }
  }

  getDetailLink(detail: OrderDetail): (string | number)[] | null {
    if (detail.itemType === 'camp' && detail.campId) {
      return ['/camp', detail.campId];
    }

    if (detail.itemType === 'equipment' && detail.campId && detail.equipmentId) {
      return ['/camp', detail.campId, 'rental', 'equipment', detail.equipmentId];
    }

    if (detail.itemType === 'equipment' && detail.campId) {
      return ['/camp', detail.campId, 'rental'];
    }

    return null;
  }

  getPrimaryDetail(order: OrderList): OrderDetail | null {
    return (
      order.details.find((detail) => detail.itemType === 'camp' && !!detail.campId) ??
      order.details.find((detail) => this.getDetailLink(detail) !== null) ??
      null
    );
  }

  getCampId(detail: OrderDetail): number | null {
    return detail.itemType === 'camp' && detail.campId ? detail.campId : null;
  }

  getReviewCampId(order: OrderList): number | null {
    const detail = order.details.find((detail) => detail.itemType === 'camp' && !!detail.campId);
    return detail ? this.getCampId(detail) : null;
  }

  getContactDetail(order: OrderList): OrderDetail | null {
    return order.details.find((detail) => !!detail.ownerId && !!detail.ownerName) ?? null;
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

  setActiveTab(status: number | 'all') {
    this.activeTab = status;
    this.currentPage = 1;
    this.expandedOrderId = null;
  }

  toggleOrder(orderId: number) {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  isOrderExpanded(orderId: number) {
    return this.expandedOrderId === orderId;
  }

  onDisplayCountChange() {
    this.displayCount = this.normalizedDisplayCount;
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
      this.expandedOrderId = null;
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
      this.expandedOrderId = null;
    }
  }

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
      case 4:
        return 'completed';
      case 5:
        return 'refunded';
      default:
        return 'unknown';
    }
  }

  getOrderStatusText(status: number): string {
    return this.orderStatusMap[status] ?? '未知狀態';
  }

  resolveImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return 'assets/placeholder.jpg';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    if (imageUrl.startsWith('/')) return `${this.apiHost}${imageUrl}`;
    return imageUrl;
  }

  resumePayment(order: OrderList) {
    this.processingOrderId = order.orderId;
    this.pendingActionError = '';

    this.checkoutService.resumePayment(order.orderId).subscribe({
      next: (result) => {
        const redirected = this.checkoutService.redirectToPayment(result);
        if (!redirected) {
          this.processingOrderId = null;
          this.pendingActionError = '無法重新導向付款頁，請稍後再試。';
        }
      },
      error: () => {
        this.processingOrderId = null;
        // 404 幾乎都代表訂單在按下去的當下被背景排程判定逾時取消了，直接把畫面同步成已取消，
        // 不然使用者看不出這筆訂單已經沒救了，會一直重複點同一顆按鈕。
        order.status = 2;
        this.pendingActionError = '訂單已逾時取消，請重新選位下單。';
      },
    });
  }

  cancelOrder(order: OrderList) {
    this.processingOrderId = order.orderId;
    this.pendingActionError = '';

    this.checkoutService.cancelPending(order.orderId).subscribe({
      next: () => {
        this.processingOrderId = null;
        order.status = 2;
      },
      error: () => {
        this.processingOrderId = null;
        this.pendingActionError = '取消訂單失敗，請稍後再試。';
      },
    });
  }

  private loadPopularCamps() {
    this.loadingPopularCamps = true;

    this.explorationService.getHome().subscribe({
      next: (feed) => {
        this.popularCamps = feed.featuredCamps.slice(0, 3);
        this.loadingPopularCamps = false;
      },
      error: () => {
        this.loadingPopularCamps = false;
      },
    });
  }
}
