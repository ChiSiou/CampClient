import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  OwnerIncomeDashboardDto,
  OwnerWalletDto,
  WithdrawalRequestDto,
  WithdrawalResultDto,
} from '../interfaces/camp.interface';

@Injectable({ providedIn: 'root' })
export class OwnerWalletService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getWallet() {
    return this.http.get<OwnerWalletDto>(this.base + '/OwnerWallet/me');
  }

  getDashboard() {
    return this.http.get<OwnerIncomeDashboardDto>(this.base + '/OwnerWallet/dashboard');
  }

  withdraw(body: WithdrawalRequestDto) {
    return this.http.post<WithdrawalResultDto>(this.base + '/OwnerWallet/withdraw', body);
  }
}
