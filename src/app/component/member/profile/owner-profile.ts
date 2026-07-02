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
  imageLoadFailed = false;
  createdAt = '';
  recentOrders: OwnerOrderList[] = [];

  private readonly apiOrigin = 'https://localhost:7011';

  constructor(
    private memberservice: MemberService,
    private chatService: ChatService,
  ) {}

  ngOnInit(): void {
    this.memberservice.getProfile().subscribe({
      next: (res) => {
        const profile = res.profileData ?? res.ProfileData;
        const ownerProfile = profile?.ownerProfile ?? profile?.OwnerProfile;

        this.name = profile?.name ?? profile?.Name ?? '';
        this.email = profile?.email ?? profile?.Email ?? '';
        this.createdAt = ownerProfile?.createdAt ?? ownerProfile?.CreatedAt ?? '';

        const licenseImage = ownerProfile?.licenseImage ?? ownerProfile?.LicenseImage;
        if (licenseImage) {
          this.setOwnerPhoto(licenseImage);
        }
      },
    });

    this.memberservice.OwnerGetPhoto().subscribe({
      next: (res) => {
        this.setOwnerPhoto(res.url ?? (res as any).Url);
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

  onAvatarError() {
    this.imageLoadFailed = true;
    this.ownerprofilephoto = '';
  }

  contactCustomer(customerId: number, customerName: string) {
    this.chatService.openChatWith(customerId, customerName);
  }

  orderStatusLabel(status: number): string {
    return ({ 0: '待付款', 1: '已付款', 2: '已取消', 3: '退款中' } as Record<number, string>)[status] ?? '未知';
  }

  orderStatusClass(status: number): string {
    return ({ 0: 'pending', 1: 'paid', 2: 'cancel', 3: 'pending' } as Record<number, string>)[status] ?? '';
  }

  private setOwnerPhoto(url?: string | null) {
    const absoluteUrl = this.toAbsoluteImageUrl(url);

    if (!absoluteUrl) {
      return;
    }

    this.imageLoadFailed = false;
    const separator = absoluteUrl.includes('?') ? '&' : '?';
    this.ownerprofilephoto = absoluteUrl + separator + 'v=' + Date.now();
  }

  private toAbsoluteImageUrl(url?: string | null): string {
    if (!url) return '';

    const trimmedUrl = url.trim();

    if (!trimmedUrl) return '';

    if (trimmedUrl.startsWith('data:') || trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }

    if (trimmedUrl.startsWith('/')) {
      return this.apiOrigin + trimmedUrl;
    }

    return this.apiOrigin + '/' + trimmedUrl;
  }
}
