import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MemberService } from '../Service/member-service';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-memberedit',
  imports: [FormsModule, RouterLink],
  templateUrl: './memberedit.html',
  styleUrl: './memberedit.css',
})
export class Memberedit implements OnInit {
  memberData = {
    name: '',
    phone: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  submitting = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';
  selectedProfilePhoto: File | null = null;
  profilePhotoPreview = '';
  imageLoadFailed = false;

  private readonly apiOrigin = environment.apiUrl.replace('/api', '');

  constructor(
    private memberservice: MemberService,
    private router: Router,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile() {
    this.memberservice.getProfile().subscribe({
      next: (res) => {
        const profile = res.profileData ?? res.ProfileData;
        this.memberData.name = profile?.name ?? profile?.Name ?? this.memberservice.getname() ?? '';
        this.memberData.email =
          profile?.email ?? profile?.Email ?? this.memberservice.getemail() ?? '';
        this.memberData.phone =
          profile?.phone ?? profile?.Phone ?? this.memberservice.getphone() ?? '';

        const profilePictureUrl = profile?.profilePictureUrl ?? profile?.ProfilePictureUrl;
        this.profilePhotoPreview = this.toAbsoluteImageUrl(profilePictureUrl);
        this.imageLoadFailed = !this.profilePhotoPreview;

        if (!this.profilePhotoPreview) {
          this.loadProfilePhotoFallback();
        }
      },
      error: () => {
        this.memberData.name = this.memberservice.getname() ?? '';
        this.memberData.email = this.memberservice.getemail() ?? '';
        this.memberData.phone = this.memberservice.getphone() ?? '';
        this.loadProfilePhotoFallback();
      },
    });
  }

  onProfilePhotoSelected(event: Event) {
    this.message = '';
    this.messageType = '';

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.selectedProfilePhoto = null;
      input.value = '';
      this.setError('請選擇圖片檔案');
      return;
    }

    this.selectedProfilePhoto = file;
    this.imageLoadFailed = false;

    const reader = new FileReader();
    reader.onload = () => {
      this.profilePhotoPreview = String(reader.result ?? '');
    };
    reader.readAsDataURL(file);
  }

  onAvatarError() {
    this.imageLoadFailed = true;
    this.profilePhotoPreview = '';
  }

  submitEdit() {
    this.message = '';
    this.messageType = '';

    const name = this.memberData.name.trim();
    const phone = this.memberData.phone.trim();
    const oldPassword = this.memberData.oldPassword.trim();
    const newPassword = this.memberData.newPassword.trim();
    const confirmPassword = this.memberData.confirmPassword.trim();

    if (!name) {
      this.messageService.add({
        key: 'top-right',
        severity: 'error',
        summary: '失敗',
        detail: '請輸入姓名',
      });
      return;
    }

    if (!phone) {
      this.messageService.add({
        key: 'top-right',
        severity: 'error',
        summary: '失敗',
        detail: '請輸入電話',
      });
      return;
    }

    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword) {
        this.messageService.add({
          key: 'top-right',
          severity: 'error',
          summary: '失敗',
          detail: '請輸入舊密碼',
        });
        return;
      }

      if (!newPassword) {
        this.messageService.add({
          key: 'top-right',
          severity: 'error',
          summary: '失敗',
          detail: '請輸入新密碼',
        });
        return;
      }

      if (!confirmPassword) {
        this.messageService.add({
          key: 'top-right',
          severity: 'error',
          summary: '失敗',
          detail: '請再次輸入新密碼',
        });
        return;
      }

      if (newPassword.length < 6) {
        this.messageService.add({
          key: 'top-right',
          severity: 'error',
          summary: '失敗',
          detail: '新密碼長度至少需要 6 個字元',
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        this.messageService.add({
          key: 'top-right',
          severity: 'error',
          summary: '失敗',
          detail: '兩次輸入的新密碼不一致',
        });
        return;
      }
    }

    const formData = new FormData();
    formData.append('Name', name);
    formData.append('Phone', phone);

    if (oldPassword && newPassword) {
      formData.append('OldPassword', oldPassword);
      formData.append('NewPassword', newPassword);
    }

    if (this.selectedProfilePhoto) {
      formData.append('File', this.selectedProfilePhoto, this.selectedProfilePhoto.name);
    }

    this.submitting = true;

    this.memberservice.memberEdit(formData).subscribe({
      next: () => {
        this.memberservice.updateCurrentProfile({
          name,
          phone,
          email: this.memberData.email,
          profilePictureUrl: this.profilePhotoPreview,
        });
        this.memberservice.getProfile().subscribe();
        this.submitting = false;
        this.messageType = 'success';
        this.message = '會員資料已更新';
        this.memberData.oldPassword = '';
        this.memberData.newPassword = '';
        this.memberData.confirmPassword = '';
        setTimeout(() => this.router.navigate(['/member-center']), 600);
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '成功',
          detail: '會員資料已更新',
        });
      },
      error: (err) => {
        this.submitting = false;

        this.messageService.add({
          key: 'top-right',
          severity: 'error',
          summary: '失敗',
          detail: '' + (err.error?.message || '舊密碼錯誤' || '請稍後再試'),
        });
      },
    });
  }

  get avatarInitial(): string {
    return (this.memberData.name || 'M').trim().charAt(0).toUpperCase();
  }

  private loadProfilePhotoFallback() {
    this.memberservice.Usergetphoto().subscribe({
      next: (res) => {
        this.profilePhotoPreview = this.toAbsoluteImageUrl(res.url ?? (res as any).Url);
        this.imageLoadFailed = !this.profilePhotoPreview;
      },
      error: () => {
        this.profilePhotoPreview = '';
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

  private setError(message: string) {
    this.messageType = 'error';
    this.message = message;
  }
}
