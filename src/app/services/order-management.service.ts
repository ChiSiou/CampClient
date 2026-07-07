import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  OrderListResultDto,
  OrderOwnerDetailDto,
  OrderCancelRequestDto,
  RefundResultDto,
} from '../interfaces/order-management.interface';

@Injectable({ providedIn: 'root' })
export class OrderManagementService {
  private base = `${environment.apiUrl}/OrderManagement`;

  constructor(private http: HttpClient) {}

  listOrders(query: {
    status?: number | null;
    checkInFrom?: string;
    checkInTo?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Observable<OrderListResultDto> {
    let params = new HttpParams();
    if (query.status !== undefined && query.status !== null) params = params.set('status', query.status);
    if (query.checkInFrom) params = params.set('checkInFrom', query.checkInFrom);
    if (query.checkInTo) params = params.set('checkInTo', query.checkInTo);
    if (query.keyword) params = params.set('keyword', query.keyword);
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);
    return this.http.get<OrderListResultDto>(this.base, { params });
  }

  getOrderDetail(orderId: number): Observable<OrderOwnerDetailDto> {
    return this.http.get<OrderOwnerDetailDto>(`${this.base}/${orderId}`);
  }

  cancelOrder(orderId: number, dto: OrderCancelRequestDto): Observable<RefundResultDto> {
    return this.http.post<RefundResultDto>(`${this.base}/${orderId}/cancel`, dto);
  }
}
