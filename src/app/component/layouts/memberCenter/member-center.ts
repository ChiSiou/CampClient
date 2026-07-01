import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MemberService } from '../../member/Service/member-service';

@Component({
  selector: 'member-center',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './member-center.html',
  styleUrl: './member-center.css',
})
export class MemberCenter {
  name = '';
  profilePhotoUrl = '';
  imageLoadFailed = false;

  private readonly apiOrigin = 'https://localhost:7011';

  constructor(private memberservice: MemberService) {}

  ngOnInit(): void {
    this.name = this.memberservice.getname() ?? '會員';
    this.loadProfilePhoto();
  }

  loadProfilePhoto() {
    this.memberservice.Usergetphoto().subscribe({
      next: (res) => {
        this.profilePhotoUrl = this.toAbsoluteImageUrl(res.url);
        this.imageLoadFailed = !this.profilePhotoUrl;
      },
      error: () => {
        this.profilePhotoUrl = '';
        this.imageLoadFailed = true;
      },
    });
  }

  onAvatarError() {
    this.imageLoadFailed = true;
    this.profilePhotoUrl = '';
  }

  get avatarInitial(): string {
    return (this.name || 'M').trim().charAt(0).toUpperCase();
  }

  private toAbsoluteImageUrl(url?: string | null): string {
    if (!url) return '';

    const trimmedUrl = url.trim();

    if (!trimmedUrl) return '';

    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }

    if (trimmedUrl.startsWith('/')) {
      return this.apiOrigin + trimmedUrl;
    }

    return this.apiOrigin + '/' + trimmedUrl;
  }

  logout() {
    this.memberservice.logout();
  }
}
