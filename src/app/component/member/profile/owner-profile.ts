import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MemberService } from '../Service/member-service';
import { ChatService } from '../../../services/chat.service';
import { OwnerOrderList } from '../interface/ownerOrderList';

@Component({
  selector: 'app-owner-profile',
  imports: [RouterLink, CommonModule],
  templateUrl: './owner-profile.html',
  styleUrl: './owner-profile.css',
})
export class OwnerProfile {
  name = '';
  email = '';
  ownerprofilephoto = '';
  createdAt = '';
  recentOrders: OwnerOrderList[] = [];

  constructor(
    private memberservice: MemberService,
    private chatService: ChatService,
  ) {}
  onActivate(component: any) {
    console.log('目前載入的子頁面：', component.constructor.name);
  }
  ngOnInit(): void {
    this.memberservice.getProfile().subscribe({
      next: (res) => {
        this.name = res.profileData.name;
        this.email = res.profileData.email;
        console.log(res.profileData.ownerProfile.createdAt);
        this.createdAt = res.profileData.ownerProfile.createdAt;
      },
    });
    this.memberservice.OwnerGetPhoto().subscribe({
      next: (res) => {
        this.ownerprofilephoto = res.url;
      },
      error: (err) => {
        console.log('err', err.message);
      },
    });
    this.memberservice.getOwnerRecentOrders().subscribe({
      next: (res) => (this.recentOrders = res),
      error: (err) => console.log(err.message),
    });
  }
  contactCustomer(customerId: number, customerName: string) {
    this.chatService.openChatWith(customerId, customerName);
  }

  // Status: 0:待付款, 1:已付款, 2:已取消, 3:申訴中
  orderStatusLabel(status: number): string {
    return (
      ({ 0: '待付款', 1: '已付款', 2: '已取消', 3: '申訴中' } as Record<number, string>)[status] ??
      '未知'
    );
  }

  orderStatusClass(status: number): string {
    return (
      ({ 0: 'pending', 1: 'paid', 2: 'cancel', 3: 'pending' } as Record<number, string>)[status] ??
      ''
    );
  }
}
