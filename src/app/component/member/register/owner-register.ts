import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../Service/member-service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-owner-register',
  imports: [FormsModule],
  templateUrl: './owner-register.html',
  styleUrl: './owner-register.css',
})
export class OwnerRegister implements OnInit {
  constructor(
    private memberService: MemberService,
    private messageService: MessageService,
    private router: Router,
  ) {}

  ownerData = {
    realName: '',
    idNumber: '',
    address: '',
    companyName: '',
    contactPhone: '',
    bankName: '',
    bankAccount: '',
    bankAccountName: '',
  };

  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  loading = false;

  ngOnInit(): void {
    this.ownerData.realName = this.memberService.getname() ?? '';
    this.ownerData.contactPhone = this.memberService.getphone() ?? '';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      input.value = '';
      this.selectedFile = null;
      this.previewUrl = null;
      this.showMessage('warn', '資料不完整', '請選擇圖片檔案');
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
    };

    reader.readAsDataURL(this.selectedFile);
  }

  submitowner() {
    const requiredFields = [
      { value: this.ownerData.companyName, message: '請輸入公司或營業名稱' },
      { value: this.ownerData.realName, message: '請輸入負責人姓名' },
      { value: this.ownerData.idNumber, message: '請輸入身分證字號或統一編號' },
      { value: this.ownerData.contactPhone, message: '請輸入聯絡電話' },
      { value: this.ownerData.address, message: '請輸入聯絡地址' },
      { value: this.ownerData.bankName, message: '請輸入銀行名稱' },
      { value: this.ownerData.bankAccount, message: '請輸入銀行帳號' },
      { value: this.ownerData.bankAccountName, message: '請輸入帳戶戶名' },
    ];

    const emptyField = requiredFields.find((field) => !field.value.trim());

    if (emptyField) {
      this.showMessage('warn', '資料不完整', emptyField.message);
      return;
    }

    if (!this.selectedFile) {
      this.showMessage('warn', '資料不完整', '請上傳證件或營業登記照片');
      return;
    }

    this.loading = true;

    this.memberService.ownerregister(this.ownerData, this.selectedFile).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate(['/']);
        this.showMessage('success', '申請成功', res.message || '申請成功，請等待審核');
      },
      error: (err) => {
        this.loading = false;
        this.showMessage('error', '申請失敗', err.error?.message || '送出申請失敗');
      },
    });
  }

  private showMessage(severity: 'success' | 'warn' | 'error', summary: string, detail: string) {
    this.messageService.add({
      key: 'top-right',
      severity,
      summary,
      detail,
    });
  }
}
