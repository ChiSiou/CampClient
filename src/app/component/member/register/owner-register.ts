import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../Service/member-service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-owner-register',
  imports: [FormsModule],
  templateUrl: './owner-register.html',
  styleUrl: './owner-register.css',
})
export class OwnerRegister implements OnInit {
  constructor(
    private memberService: MemberService,
    private messageService: MessageService
  ) {}

  ownerData = {
    realName: '',
    idNumber: '',
    address: '',
  };

  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  loading = false;

  ngOnInit(): void {
    this.ownerData.realName = this.memberService.getname();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    this.selectedFile = input.files[0];

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
    };

    reader.readAsDataURL(this.selectedFile);
  }

  submitowner() {
    if (!this.ownerData.realName.trim()) {
      this.messageService.add({
        key: 'top-right',
        severity: 'warn',
        summary: '資料不完整',
        detail: '請輸入真實姓名',
      });
      return;
    }

    if (!this.ownerData.idNumber.trim()) {
      this.messageService.add({
        key: 'top-right',
        severity: 'warn',
        summary: '資料不完整',
        detail: '請輸入身分證字號或統一編號',
      });
      return;
    }

    if (!this.ownerData.address.trim()) {
      this.messageService.add({
        key: 'top-right',
        severity: 'warn',
        summary: '資料不完整',
        detail: '請輸入地址',
      });
      return;
    }

    if (!this.selectedFile) {
      this.messageService.add({
        key: 'top-right',
        severity: 'warn',
        summary: '資料不完整',
        detail: '請先選擇照片',
      });
      return;
    }

    this.loading = true;

    this.memberService.ownerregister(this.ownerData, this.selectedFile).subscribe({
      next: (res) => {
        this.loading = false;

        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '申請成功',
          detail: res.message || '申請成功，等待審核',
        });
      },
      error: (err) => {
        this.loading = false;

        this.messageService.add({
          key: 'top-right',
          severity: 'error',
          summary: '申請失敗',
          detail: err.error?.message || '營主申請失敗',
        });
      },
    });
  }
}