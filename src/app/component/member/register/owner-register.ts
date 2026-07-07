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
  private readonly maxImageSizeBytes = 5 * 1024 * 1024;
  private readonly supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

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

    if (!this.isSupportedImageFile(file)) {
      input.value = '';
      this.selectedFile = null;
      this.previewUrl = null;
      this.showMessage('warn', '資料格式錯誤', '圖片僅支援 JPG、PNG、WEBP，且大小不可超過 5MB');
      return;
    }

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
    const validationMessage = this.validateOwnerData();

    if (validationMessage) {
      this.showMessage('warn', '資料格式錯誤', validationMessage);
      return;
    }

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

  private validateOwnerData(): string | null {
    this.trimOwnerData();

    if (!this.ownerData.companyName) return '請輸入公司或營區名稱';
    if (!this.ownerData.realName) return '請輸入真實姓名';
    if (!this.ownerData.idNumber) return '請輸入身分證字號或統一編號';
    if (!this.ownerData.contactPhone) return '請輸入聯絡電話';
    if (!this.ownerData.address) return '請輸入聯絡地址';
    if (!this.ownerData.bankName) return '請輸入銀行名稱';
    if (!this.ownerData.bankAccount) return '請輸入銀行帳號';
    if (!this.ownerData.bankAccountName) return '請輸入戶名';

    if (this.ownerData.companyName.length > 255) return '公司或營區名稱不可超過 255 字';
    if (this.ownerData.realName.length < 2 || this.ownerData.realName.length > 50) {
      return '真實姓名需為 2 到 50 字';
    }
    if (!this.isValidIdNumberOrTaxId(this.ownerData.idNumber)) {
      return '身分證需為 1 碼英文加 9 碼數字，統一編號需為 8 碼數字';
    }
    if (!this.isValidPhone(this.ownerData.contactPhone)) {
      return '聯絡電話需為手機 09xxxxxxxx，或市話 0x-xxxxxxx';
    }
    if (this.ownerData.address.length < 5 || this.ownerData.address.length > 255) {
      return '聯絡地址需為 5 到 255 字';
    }
    if (this.ownerData.bankName.length < 2 || this.ownerData.bankName.length > 100) {
      return '銀行名稱需為 2 到 100 字';
    }
    if (!this.isValidBankAccount(this.ownerData.bankAccount)) {
      return '銀行帳號只能包含數字或 -，長度需為 6 到 30 字';
    }
    if (this.ownerData.bankAccountName.length < 2 || this.ownerData.bankAccountName.length > 100) {
      return '戶名需為 2 到 100 字';
    }

    return null;
  }

  private trimOwnerData() {
    this.ownerData.companyName = this.ownerData.companyName.trim();
    this.ownerData.realName = this.ownerData.realName.trim();
    this.ownerData.idNumber = this.ownerData.idNumber.trim().toUpperCase();
    this.ownerData.contactPhone = this.ownerData.contactPhone.trim();
    this.ownerData.address = this.ownerData.address.trim();
    this.ownerData.bankName = this.ownerData.bankName.trim();
    this.ownerData.bankAccount = this.ownerData.bankAccount.trim();
    this.ownerData.bankAccountName = this.ownerData.bankAccountName.trim();
  }

  private isValidIdNumberOrTaxId(value: string): boolean {
    return /^[A-Z][12]\d{8}$/.test(value) || /^\d{8}$/.test(value);
  }

  private isValidPhone(value: string): boolean {
    return /^09\d{8}$/.test(value) || /^0\d{1,2}-?\d{6,8}$/.test(value);
  }

  private isValidBankAccount(value: string): boolean {
    return /^[0-9-]{6,30}$/.test(value);
  }

  private isSupportedImageFile(file: File): boolean {
    return this.supportedImageTypes.includes(file.type) && file.size <= this.maxImageSizeBytes;
  }
}
