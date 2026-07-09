import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MemberService } from '../Service/member-service';
import { ChatService } from '../../../services/chat.service';
import { OwnerOrderList } from '../interface/ownerOrderList';
import { CampManagementService } from '../../../services/camp-management.service';
import { CampgroundListItemDto } from '../../../interfaces/camp-management.interface';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';

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
  status = false;
  recentOrders: OwnerOrderList[] = [];
  campgrounds: CampgroundListItemDto[] = [];
  campcount = 0;
  recentordercount = 0;
  private readonly apiOrigin = environment.apiUrl.replace('/api', '');
  private profileSubscription?: Subscription;

  constructor(
    private memberservice: MemberService,
    private chatService: ChatService,
    private campManagementService: CampManagementService,
  ) {}

  ngOnInit(): void {
    this.profileSubscription = this.memberservice.currentProfile$.subscribe((profile) => {
      if (profile?.name) {
        this.name = profile.name;
      }
    });

    this.memberservice.getProfile().subscribe({
      next: (res) => {
        console.log('res', res);
        const profile = res.profileData ?? res.ProfileData;
        const ownerProfile = profile?.ownerProfile ?? profile?.OwnerProfile;
        this.name = ownerProfile?.realname ?? ownerProfile?.realName ?? ownerProfile?.Realname ?? profile?.name ?? profile?.Name ?? '';
        this.email = profile?.email ?? profile?.Email ?? '';
        this.createdAt = ownerProfile?.createdAt ?? ownerProfile?.CreatedAt ?? '';
        const roles = profile?.roles ?? profile?.Roles ?? [];
        this.status = roles.includes('Owner');
        const licenseImage = ownerProfile?.licenseImage ?? ownerProfile?.LicenseImage;
        if (licenseImage) {
          this.setOwnerPhoto(licenseImage);
        }
      },
      error: (err) => {
        console.log('err', err.message);
      },
    });

    this.memberservice.OwnerGetPhoto().subscribe({
      next: (res) => {
        this.setOwnerPhoto(res.url);
      },
      error: (err) => {
        console.log('err', err.message);
      },
    });

    this.memberservice.getOwnerRecentOrders().subscribe({
      next: (res) => {
        ((this.recentOrders = res), (this.recentordercount = res.length));
      },
      error: (err) => {
        console.log(err.message);
      },
    });
    this.campManagementService.listMine().subscribe({
      next: (res) => {
        this.campgrounds = res;
        this.campcount = res.length;
      },
      error: (err) => {
        console.log(err.message);
      },
    });
  }

  ngOnDestroy(): void {
    this.profileSubscription?.unsubscribe();
  }

  onAvatarError() {
    this.imageLoadFailed = true;
    this.ownerprofilephoto = '';
  }

  contactCustomer(customerId: number, customerName: string) {
    this.chatService.openChatWith(customerId, customerName);
  }

  orderStatusLabel(status: number): string {
    return (
      ({ 0: '待付款', 1: '已付款', 2: '已取消', 3: '退款中' } as Record<number, string>)[status] ??
      '未知'
    );
  }

  orderStatusClass(status: number): string {
    return (
      ({ 0: 'pending', 1: 'paid', 2: 'cancel', 3: 'pending' } as Record<number, string>)[status] ??
      ''
    );
  }

  campgroundStatusLabel(status: number): string {
    return ({ 0: '草稿', 1: '上架中' } as Record<number, string>)[status] ?? '未知狀態';
  }

  campgroundStatusClass(status: number): string {
    return status === 1 ? 'active' : 'pending';
  }

  campgroundCoverUrl(url?: string | null): string {
    return this.toAbsoluteImageUrl(url) || 'https://placehold.co/120x90';
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

    if (
      trimmedUrl.startsWith('data:') ||
      trimmedUrl.startsWith('http://') ||
      trimmedUrl.startsWith('https://')
    ) {
      return trimmedUrl;
    }

    if (trimmedUrl.startsWith('/')) {
      return this.apiOrigin + trimmedUrl;
    }

    return this.apiOrigin + '/' + trimmedUrl;
  }
}
