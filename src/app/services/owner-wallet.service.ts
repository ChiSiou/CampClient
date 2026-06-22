import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  OwnerWalletDto,
  WithdrawalRequestDto,
  WithdrawalResultDto,
} from '../interfaces/camp.interface';

@Injectable({ providedIn: 'root' })
export class OwnerWalletService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getWallet(ownerId: number) {
    return this.http.get<OwnerWalletDto>(`${this.base}/OwnerWallet/${ownerId}`);
  }

  withdraw(ownerId: number, body: WithdrawalRequestDto) {
    return this.http.post<WithdrawalResultDto>(`${this.base}/OwnerWallet/${ownerId}/withdraw`, body);
  }
}
