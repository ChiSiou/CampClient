import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { CampSelectionService } from '../../services/camp-selection.service';
import { EquipmentCartService } from '../../services/equipment-cart.service';
import { PaymentStatusDto } from '../../interfaces/camp.interface';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 30000;

@Component({
  selector: 'app-payment-result',
  imports: [RouterLink],
  templateUrl: './payment-result.html',
  styleUrl: './payment-result.css',
})
export class PaymentResult implements OnInit, OnDestroy {
  orderNumber = '';
  status: PaymentStatusDto | null = null;
  // 找不到 orderNumber（例如直接打開這個網址）或輪詢逾時都算錯誤狀態，但訊息不同
  errorMessage = '';
  timedOut = false;

  private pollTimer?: ReturnType<typeof setInterval>;
  private timeoutTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private campSelectionService: CampSelectionService,
  ) {}

  ngOnInit() {
    this.orderNumber = this.route.snapshot.queryParamMap.get('orderNumber') ?? '';

    if (!this.orderNumber) {
      this.errorMessage = '找不到訂單編號，請從訂單記錄重新查詢付款狀態。';
      return;
    }

    this.startPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private startPolling() {
    this.timedOut = false;
    this.checkStatus();
    this.pollTimer = setInterval(() => this.checkStatus(), POLL_INTERVAL_MS);
    this.timeoutTimer = setTimeout(() => {
      this.stopPolling();
      this.timedOut = true;
    }, POLL_TIMEOUT_MS);
  }

  private stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    this.pollTimer = undefined;
    this.timeoutTimer = undefined;
  }

  retryCheck() {
    this.errorMessage = '';
    this.startPolling();
  }

  private checkStatus() {
    this.paymentService.getStatus(this.orderNumber).subscribe({
      next: res => {
        this.status = res;
        // 已經有確定結果（不是 Processing）就不用再繼續輪詢
        if (res.status !== 'Processing') {
          this.stopPolling();
          // 不管成功還是失敗，這筆訂單的結果都確定了，選位資料/裝備購物車才真正清空——
          // checkout.ts 故意不在跳轉去綠界那一刻清空，就是為了讓使用者付款失敗/中途放棄時
          // 還能回去重試或主動取消，要等到這裡有確定結果才是清空的時機點
          this.campSelectionService.clear();
          sessionStorage.removeItem(EquipmentCartService.STORAGE_KEY);
        }
      },
      error: () => {
        this.stopPolling();
        this.errorMessage = '查詢付款狀態失敗，請稍後再試。';
      },
    });
  }
}
