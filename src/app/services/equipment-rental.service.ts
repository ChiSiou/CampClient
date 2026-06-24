import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  EquipmentListItemDto,
  EquipmentDetailDto,
  ShippingMethodDto,
  EquipmentBreakdownRequestDto,
  EquipmentBreakdownResultDto,
} from '../interfaces/camp.interface';

@Injectable({ providedIn: 'root' })
export class EquipmentRentalService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getEquipmentList() {
    return this.http.get<EquipmentListItemDto[]>(`${this.base}/EquipmentRental`);
  }

  getEquipmentDetail(productId: number) {
    return this.http.get<EquipmentDetailDto>(`${this.base}/EquipmentRental/${productId}`);
  }

  getShippingMethods() {
    return this.http.get<ShippingMethodDto[]>(`${this.base}/EquipmentRental/shipping-methods`);
  }

  calculateBreakdown(body: EquipmentBreakdownRequestDto) {
    return this.http.post<EquipmentBreakdownResultDto>(
      `${this.base}/EquipmentRental/breakdown`,
      body,
    );
  }
}
