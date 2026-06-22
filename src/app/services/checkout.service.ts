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
  // 這裡直接操作 DOM 轉成表單提交以重定向到第三方支付頁面。
  redirectToPayment(result: CheckoutResultDto) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = result.paymentServiceUrl;
    Object.entries(result.paymentFormParams).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.name = k;
      input.value = v;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }
}
