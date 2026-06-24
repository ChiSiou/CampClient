import { Message } from 'primeng/message';
import { Component } from '@angular/core';
import { MemberService } from '../Service/member-service';
import { OrderList } from '../interface/orderList';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'orders',
  imports: [DatePipe, NgClass],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  constructor(private memberservice: MemberService) {}
  orders: OrderList[] = [];
  ngOnInit() {
    this.memberservice.getorder().subscribe({
      next: (res) => {
        this.orders = res;
        console.log('response', res);
      },
      error: (err) => {
        console.log('error', err.Message);
      },
    });
  }
  activeTab: number | 'all' = 'all';

  setActiveTab(status: number | 'all') {
    this.activeTab = status;
  }

  get filteredOrders() {
    if (this.activeTab === 'all') {
      return this.orders;
    }

    return this.orders.filter((x) => x.status === this.activeTab);
  }
  orderStatusMap: { [key: number]: string } = {
    0: '待付款',
    1: '已付款',
    2: '已取消',
    3: '申訴中',
  };
  getOrderStatusClass(status: number): string {
    switch (status) {
      case 0:
        return 'pending';
      case 1:
        return 'paid';
      case 2:
        return 'cancelled';
      case 3:
        return 'appeal';
      default:
        return 'unknown';
    }
  }
  getOrderStatusText(status: number): string {
    return this.orderStatusMap[status] ?? '未知狀態';
  }
}
