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
  memberData = {
    Name: '',
    Phone: '',
    Email: '',
    Password: '',
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
  submituser() {
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
          detail: '會員資料與照片都上傳成功',
        });
        this.router.navigate(['login']);
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
