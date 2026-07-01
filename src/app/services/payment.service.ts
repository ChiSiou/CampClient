import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  PaymentStatusDto,
  OrderReceiptDto,
  RefundRequestDto,
  RefundResultDto,
  RefundPolicyDto,
} from '../interfaces/camp.interface';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getStatus(orderNumber: string) {
    return this.http.get<PaymentStatusDto>(`${this.base}/Payment/status/${orderNumber}`);
  }

  // 付款結果頁的訂單收據（訂了什麼 + 金額明細）
  getReceipt(orderNumber: string) {
    return this.http.get<OrderReceiptDto>(`${this.base}/Payment/receipt/${orderNumber}`);
  }

  getRefundPolicy() {
    return this.http.get<RefundPolicyDto>(`${this.base}/Payment/refund-policy`);
  }

  calculateRefund(body: RefundRequestDto) {
    return this.http.post<RefundResultDto>(`${this.base}/Payment/refund/calculate`, body);
  }

  submitRefund(body: RefundRequestDto) {
    return this.http.post<RefundResultDto>(`${this.base}/Payment/refund/submit`, body);
  }
}
