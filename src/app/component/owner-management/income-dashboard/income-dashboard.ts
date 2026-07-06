import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OwnerIncomeDashboardDto } from '../../../interfaces/camp.interface';
import { OwnerWalletService } from '../../../services/owner-wallet.service';

@Component({
  selector: 'app-income-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './income-dashboard.html',
  styleUrl: './income-dashboard.css',
})
export class IncomeDashboard implements OnInit {
  dashboard: OwnerIncomeDashboardDto | null = null;
  loading = true;
  errorMessage = '';

  // 提領表單狀態
  showWithdrawForm = false;
  withdrawAmount: number | null = null;
  withdrawBankAccount = '';
  withdrawing = false;
  withdrawError = '';
  withdrawSuccessMessage = '';

  // 台灣各銀行帳號長度不一（10~16碼），帳號本身是連續數字，不需要 - 分隔（避免使用者不確定要不要加 - 造成困惑，統一規定只收純數字）
  private readonly bankAccountPattern = /^\d{10,16}$/;

  get bankAccountInvalid(): boolean {
    const v = this.withdrawBankAccount.trim();
    return v.length > 0 && !this.bankAccountPattern.test(v);
  }

  constructor(private ownerWalletService: OwnerWalletService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.errorMessage = '';

    this.ownerWalletService.getDashboard().subscribe({
      next: (res) => {
        this.dashboard = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || '收入報表載入失敗';
      },
    });
  }

  toggleWithdrawForm() {
    this.showWithdrawForm = !this.showWithdrawForm;
    this.withdrawError = '';
    this.withdrawSuccessMessage = '';
    if (!this.showWithdrawForm) {
      this.withdrawAmount = null;
      this.withdrawBankAccount = '';
    }
  }

  // 前端先擋一次明顯錯誤，最終仍以後端 RequestWithdrawalAsync 的驗證結果為準
  canSubmitWithdraw(): boolean {
    if (!this.dashboard || this.withdrawing) return false;
    if (this.withdrawAmount == null || this.withdrawAmount <= 0) return false;

    const bankAccount = this.withdrawBankAccount.trim();
    if (!bankAccount || !this.bankAccountPattern.test(bankAccount)) return false;

    const policy = this.dashboard.withdrawalPolicy;
    if (this.withdrawAmount < policy.minWithdrawalAmount) return false;
    if (this.withdrawAmount > policy.maxWithdrawalAmount) return false;
    if (this.withdrawAmount > this.dashboard.balance) return false;
    return true;
  }

  submitWithdraw() {
    if (!this.canSubmitWithdraw() || this.withdrawAmount == null) return;

    this.withdrawing = true;
    this.withdrawError = '';
    this.withdrawSuccessMessage = '';

    this.ownerWalletService
      .withdraw({ amount: this.withdrawAmount, bankAccount: this.withdrawBankAccount.trim() })
      .subscribe({
        next: (res) => {
          this.withdrawing = false;
          this.withdrawSuccessMessage = res.message || '提領申請已送出。';
          this.withdrawAmount = null;
          this.withdrawBankAccount = '';
          this.loadDashboard(); // 重新整理餘額與提領紀錄
        },
        error: (err) => {
          this.withdrawing = false;
          this.withdrawError = err.error?.message || '提領申請失敗，請稍後再試。';
        },
      });
  }

  formatCurrency(value?: number | null): string {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }

  barHeight(value: number): number {
    const max = Math.max(...(this.dashboard?.monthlyRevenue.map((item) => item.netRevenue) ?? [0]), 1);
    return Math.max(8, Math.round((value / max) * 160));
  }

  revenueStatusLabel(status: number): string {
    return ({ 0: '待結算', 1: '已結算', 2: '已取消' } as Record<number, string>)[status] ?? '未知';
  }

  withdrawalStatusLabel(status: number): string {
    return ({ 0: '處理中', 1: '已撥款', 2: '已取消' } as Record<number, string>)[status] ?? '未知';
  }

  statusClass(status: number): string {
    return ({ 0: 'pending', 1: 'success', 2: 'cancel' } as Record<number, string>)[status] ?? 'pending';
  }
}
