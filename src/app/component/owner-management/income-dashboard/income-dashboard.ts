import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { OwnerIncomeDashboardDto } from '../../../interfaces/camp.interface';
import { OwnerWalletService } from '../../../services/owner-wallet.service';

@Component({
  selector: 'app-income-dashboard',
  imports: [CommonModule],
  templateUrl: './income-dashboard.html',
  styleUrl: './income-dashboard.css',
})
export class IncomeDashboard implements OnInit {
  dashboard: OwnerIncomeDashboardDto | null = null;
  loading = true;
  errorMessage = '';

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
