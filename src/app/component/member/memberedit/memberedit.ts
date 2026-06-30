import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MemberService } from '../Service/member-service';

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

  constructor(
    private memberservice: MemberService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile() {
    this.memberservice.getProfile().subscribe({
      next: (res) => {
        const profile = res.profileData ?? res.ProfileData;
        this.memberData.name = profile?.name ?? this.memberservice.getname() ?? '';
        this.memberData.email = profile?.email ?? this.memberservice.getemail() ?? '';
        this.memberData.phone = profile?.phone ?? this.memberservice.getphone() ?? '';
      },
      error: () => {
        this.memberData.name = this.memberservice.getname() ?? '';
        this.memberData.email = this.memberservice.getemail() ?? '';
        this.memberData.phone = this.memberservice.getphone() ?? '';
      },
    });
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
      this.setError('請輸入姓名');
      return;
    }

    if (!phone) {
      this.setError('請輸入電話');
      return;
    }

    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword) {
        this.setError('請輸入目前密碼');
        return;
      }

      if (!newPassword) {
        this.setError('請輸入新密碼');
        return;
      }

      if (!confirmPassword) {
        this.setError('請再次確認新密碼');
        return;
      }

      if (newPassword.length < 6) {
        this.setError('新密碼至少需要 6 個字元');
        return;
      }

      if (newPassword !== confirmPassword) {
        this.setError('兩次輸入的新密碼不一致');
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

    this.submitting = true;

    this.memberservice.memberEdit(formData).subscribe({
      next: () => {
        this.submitting = false;
        this.messageType = 'success';
        this.message = '會員資料已更新';
        this.memberData.oldPassword = '';
        this.memberData.newPassword = '';
        this.memberData.confirmPassword = '';
        setTimeout(() => this.router.navigate(['/member-center']), 600);
      },
      error: (err) => {
        this.submitting = false;
        this.setError(err.error?.message ?? '資料更新失敗，請稍後再試');
      },
    });
  }

  private setError(message: string) {
    this.messageType = 'error';
    this.message = message;
  }
}
