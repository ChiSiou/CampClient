import { Message } from 'primeng/message';
import { MemberService } from './../Service/member-service';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../notification-center/Service/NotificationService';

@Component({
  selector: 'profile',
  imports: [RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  profile = {
    name: '',
    email: '',
    phone: '',
  };
  unreadCount = 0;
  ordercount = 0;
  constructor(
    private memberService: MemberService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.notification.getUnreadCount().subscribe({
      next: (res) => {
        this.unreadCount = res;
      },
      error: (err) => {
        console.log(err.Message);
      },
    });
    this.memberService.getProfile().subscribe({
      next: (res) => {
        this.profile = res.profileData;
        console.log(res);
      },
      error: (err) => {
        console.log('message:', err.message);
      },
    });
    this.memberService.getorder().subscribe({
      next: (res) => {
        this.ordercount = res.length;
      },
      error: (err) => {
        console.log(err.message);
      },
    });
  }
  MemberEdit() {
    this.memberService.memberEdit;
  }
}
