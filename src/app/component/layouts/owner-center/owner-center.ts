import { Component } from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MemberService } from '../../member/Service/member-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-owner-center',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './owner-center.html',
  styleUrl: './owner-center.css',
})
export class OwnerCenter {
  name = '';
  ownerProfilePhotoUrl = '';
  imageLoadFailed = false;

  private readonly apiOrigin = 'https://localhost:7011';
  private profileSubscription?: Subscription;

  constructor(
    private chatService: ChatService,
    private memberservice: MemberService,
  ) {}

  ngOnInit(): void {
    this.profileSubscription = this.memberservice.currentProfile$.subscribe((profile) => {
      this.applyCurrentProfile(profile);
    });

    this.memberservice.getProfile().subscribe({
      next: (res) => {
        const profile = res.profileData ?? res.ProfileData;
        const ownerProfile = profile?.ownerProfile ?? profile?.OwnerProfile;

        this.name =
          ownerProfile?.realname ??
          ownerProfile?.realName ??
          ownerProfile?.Realname ??
          profile?.name ??
          profile?.Name ??
          this.memberservice.getname() ??
          '營主';

        const profilePictureUrl =
          ownerProfile?.licenseImage ??
          ownerProfile?.LicenseImage ??
          profile?.profilePictureUrl ??
          profile?.ProfilePictureUrl;

        if (profilePictureUrl) {
          this.ownerProfilePhotoUrl = this.toAbsoluteImageUrl(profilePictureUrl);
          this.imageLoadFailed = !this.ownerProfilePhotoUrl;
        } else {
          this.loadOwnerPhoto();
        }
      },
      error: () => {
        this.name = this.memberservice.getname() ?? '營主';
        this.loadOwnerPhoto();
      },
    });
  }

  ngOnDestroy(): void {
    this.profileSubscription?.unsubscribe();
  }

  onAvatarError() {
    this.imageLoadFailed = true;
    this.ownerProfilePhotoUrl = '';
  }

  get avatarInitial(): string {
    return (this.name || 'O').trim().charAt(0).toUpperCase();
  }

  contactCustomer(customerId: number, customerName: string) {
    this.chatService.openChatWith(customerId, customerName);
  }

  private applyCurrentProfile(profile: any) {
    if (profile?.name) {
      this.name = profile.name;
    }

    if (profile?.profilePictureUrl) {
      this.ownerProfilePhotoUrl = this.toAbsoluteImageUrl(profile.profilePictureUrl);
      this.imageLoadFailed = !this.ownerProfilePhotoUrl;
    }
  }

  private loadOwnerPhoto() {
    this.memberservice.OwnerGetPhoto().subscribe({
      next: (res) => {
        this.ownerProfilePhotoUrl = this.toAbsoluteImageUrl(res.url ?? (res as any).Url);
        this.imageLoadFailed = !this.ownerProfilePhotoUrl;
      },
      error: () => {
        this.ownerProfilePhotoUrl = '';
        this.imageLoadFailed = true;
      },
    });
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
