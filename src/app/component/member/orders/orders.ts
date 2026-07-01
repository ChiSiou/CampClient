import { Message } from 'primeng/message';
import { Component, Input } from '@angular/core';
import { MemberService } from '../Service/member-service';
import { OrderList } from '../interface/orderList';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CheckoutService } from '../../../services/checkout.service';
import { ExplorationService } from '../../../services/exploration.service';
import { CampSearchResultDto } from '../../../interfaces/camp.interface';
import { CampCard } from '../../shared/camp-card/camp-card';

@Component({
  selector: 'orders',
  imports: [DatePipe, NgClass, FormsModule, RouterLink, CampCard],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  constructor(
    private memberservice: MemberService,
    private checkoutService: CheckoutService,
    private explorationService: ExplorationService,
  ) {}
  orders: OrderList[] = [];
  popularCamps: CampSearchResultDto[] = [];
  loadingPopularCamps = false;
  displayCount = 5;
  currentPage = 1;

  // 「繼續付款」「取消訂單」按鈕的處理中狀態，用 orderId 當 key，避免一個訂單按下去
  // 連帶把清單裡其他訂單的按鈕也鎖住
  processingOrderId: number | null = null;
  pendingActionError = '';

  ngOnInit() {
    this.loadPopularCamps();

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
    4: '已完成',
    5: '已退款',
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

  // 待付款訂單「繼續付款」：重新組一份付款表單，跳轉回綠界
  // 使用場景：使用者付款到一半關掉綠界分頁/瀏覽器當機重開，從這個「我的訂單」頁面找回來繼續付
  resumePayment(order: OrderList) {
    this.processingOrderId = order.orderId;
    this.pendingActionError = '';

    this.checkoutService.resumePayment(order.orderId).subscribe({
      next: (result) => {
        const redirected = this.checkoutService.redirectToPayment(result);
        if (!redirected) {
          this.processingOrderId = null;
          this.pendingActionError = '導向付款頁面失敗，請稍後再試。';
        }
        // 成功的話瀏覽器會直接跳轉走，不用復原 processingOrderId
      },
      error: () => {
        this.processingOrderId = null;
        this.pendingActionError = '無法繼續付款，這筆訂單可能已經失效，請重新整理頁面。';
      },
    });
  }

  // 待付款訂單「取消訂單」：立刻釋放鎖定的營位，不用等 15 分鐘背景排程
  cancelOrder(order: OrderList) {
    this.processingOrderId = order.orderId;
    this.pendingActionError = '';

    this.checkoutService.cancelPending(order.orderId).subscribe({
      next: () => {
        this.processingOrderId = null;
        order.status = 2; // 直接更新畫面上的狀態，不用整頁重新打 API 才看到變化
      },
      error: () => {
        this.processingOrderId = null;
        this.pendingActionError = '取消失敗，請稍後再試。';
      },
    });
  }
}
