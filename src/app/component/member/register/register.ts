import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { memberregisterData } from '../interface/memberRegisterData';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../Service/member-service';
import { combineLatestInit } from 'rxjs/internal/observable/combineLatest';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly phonePattern = /^09\d{8}$/;

  memberData = {
    Name: '',
    Phone: '',
    Email: '',
    Password: '',
    ConfirmPassword: '',
  };

  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  constructor(
    private httpClient: HttpClient,
    private memberservice: MemberService,
    private router: Router,

    private messageService: MessageService,
  ) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    this.selectedFile = input.files[0];

    // 預覽圖片
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
    };
    reader.readAsDataURL(this.selectedFile);
  }
  quickRegister() {
    this.memberData.Name = '陳維昕';
    this.memberData.Phone = '0965164875';
    this.memberData.Email = 'CampPlatform0420@gmail.com';
    this.memberData.Password = '!@#CampPlatform';
    this.memberData.ConfirmPassword = '!@#CampPlatform';
  }
  submituser() {
    if (!this.emailPattern.test(this.memberData.Email.trim())) {
      this.messageService.add({
        key: 'top-right',
        severity: 'error',
        summary: 'Email 格式錯誤',
        detail: '請輸入正確 Email 格式，例如 user@example.com',
      });
      return;
    }

    if (!this.phonePattern.test(this.memberData.Phone.trim())) {
      this.messageService.add({
        key: 'top-right',
        severity: 'error',
        summary: '手機格式錯誤',
        detail: '請輸入 09 開頭共 10 碼的手機號碼',
      });
      return;
    }

    if (!this.memberData.Password) {
      this.messageService.add({
        key: 'top-right',
        severity: 'error',
        summary: '密碼未填寫',
        detail: '請輸入密碼',
      });
      return;
    }
    if (this.memberData.Password.length < 6) {
      this.messageService.add({
        key: 'top-right',
        severity: 'error',
        summary: '失敗',
        detail: '密碼長度至少需要 6 個字元',
      });
      return;
    }
    if (this.memberData.Password !== this.memberData.ConfirmPassword) {
      this.messageService.add({
        key: 'top-right',
        severity: 'error',
        summary: '密碼不一致',
        detail: '兩次輸入的密碼不一致',
      });
      return;
    }

    if (!this.selectedFile) {
      alert('請先選擇照片');
      return;
    }
    this.memberservice.memberregister(this.memberData, this.selectedFile!).subscribe({
      next: (res) => {
        console.log('會員資訊上傳成功', res);
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '註冊成功',
          detail: '註冊成功，請到信箱完成驗證後再登入',
        });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.log(err);
        this.messageService.add({
          key: 'top-right',
          severity: 'error',
          summary: `註冊失敗`,
          detail: '會員資訊上傳失敗',
        });
      },
    });
  }
}
