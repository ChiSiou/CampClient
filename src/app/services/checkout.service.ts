import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  CampSelectionRequestDto,
  CheckoutSummaryDto,
  CheckoutSubmitDto,
  CheckoutResultDto,
} from '../interfaces/camp.interface';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getSummary(body: CampSelectionRequestDto) {
    return this.http.post<CheckoutSummaryDto>(`${this.base}/Checkout/summary`, body);
  }

  submit(body: CheckoutSubmitDto) {
    return this.http.post<CheckoutResultDto>(`${this.base}/Checkout/submit`, body);
  }

  // 主動取消自己卡住的待付款訂單，立刻釋放鎖定的營位，不用等 15 分鐘背景排程。
  // orderId 可選：「我的訂單」頁知道確切訂單就帶上去精準取消；/checkout 頁不知道就不帶。
  cancelPending(orderId?: number) {
    const query = orderId != null ? `?orderId=${orderId}` : '';
    return this.http.post<{ cancelled: boolean }>(`${this.base}/Checkout/cancel-pending${query}`, {});
  }

  // 「我的訂單」頁面的「繼續付款」：重新組一份付款表單，回傳結果交給 redirectToPayment() 跳轉
  resumePayment(orderId: number) {
    return this.http.post<CheckoutResultDto>(`${this.base}/Checkout/${orderId}/resume`, {});
  }
  // 這裡直接操作 DOM 轉成表單提交以重定向到第三方支付頁面。
  // 回傳是否真的觸發了跳轉——呼叫端要靠這個判斷要不要把畫面的「處理中」狀態復原並顯示錯誤，
  // 不然像綠界設定值缺漏這種情況，這裡會靜默不做事，畫面就會卡死在「處理中」。
  redirectToPayment(result: CheckoutResultDto): boolean {
    if (!result.success || !result.paymentServiceUrl || !result.paymentFormParams) return false;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = result.paymentServiceUrl;
    Object.entries(result.paymentFormParams).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type = 'hidden'; // 不設的話預設是 text，欄位會整個顯示在頁面上
      input.name = k;
      input.value = v;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    return true;
  }
}
