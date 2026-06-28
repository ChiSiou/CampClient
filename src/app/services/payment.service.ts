import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  PaymentStatusDto,
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
