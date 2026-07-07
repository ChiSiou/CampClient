import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MemberService } from '../Service/member-service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-owner-profile-edit',
  imports: [FormsModule, RouterLink],
  templateUrl: './owner-profile-edit.html',
  styleUrl: './owner-profile-edit.css',
})
export class OwnerProfileEdit implements OnInit {
  private readonly maxImageSizeBytes = 5 * 1024 * 1024;
  private readonly supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

  ownerData = {
    companyName: '',
    realName: '',
    idNumber: '',
    contactPhone: '',
    address: '',
    bankName: '',
    bankAccount: '',
    bankAccountName: '',
  };

  selectedAvatarFile: File | null = null;
  avatarPreviewUrl = '';
  submitting = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  constructor(
    private memberService: MemberService,
    private router: Router,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadOwnerProfile();
  }

  onAvatarSelected(event: Event) {
    this.message = '';
    this.messageType = '';

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!this.isSupportedImageFile(file)) {
      input.value = '';
      this.selectedAvatarFile = null;
      this.setError('圖片僅支援 JPG、PNG、WEBP，且大小不可超過 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      input.value = '';
      this.selectedAvatarFile = null;
      this.setError('請選擇圖片檔案');
      return;
    }

    this.selectedAvatarFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreviewUrl = String(reader.result ?? '');
    };
    reader.readAsDataURL(file);
  }

  submitOwnerEdit() {
    this.message = '';
    this.messageType = '';

    const validationMessage = this.validateOwnerData();

    if (validationMessage) {
      this.setError(validationMessage);
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
      this.setError(emptyField.message);
      return;
    }

    const formData = new FormData();
    formData.append('CompanyName', this.ownerData.companyName.trim());
    formData.append('Realname', this.ownerData.realName.trim());
    formData.append('IdNumber', this.ownerData.idNumber.trim());
    formData.append('ContactPhone', this.ownerData.contactPhone.trim());
    formData.append('Address', this.ownerData.address.trim());
    formData.append('BankName', this.ownerData.bankName.trim());
    formData.append('BankAccount', this.ownerData.bankAccount.trim());
    formData.append('BankAccountName', this.ownerData.bankAccountName.trim());

    if (this.selectedAvatarFile) {
      formData.append('File', this.selectedAvatarFile, this.selectedAvatarFile.name);
    }

    this.submitting = true;

    this.memberService.ownerEdit(formData).subscribe({
      next: () => {
        this.memberService.updateCurrentProfile({
          name: this.ownerData.realName.trim(),
          phone: this.ownerData.contactPhone.trim(),
          profilePictureUrl: this.avatarPreviewUrl,
        });
        this.memberService.getProfile().subscribe({
          next: () => {
            this.memberService.updateCurrentProfile({
              name: this.ownerData.realName.trim(),
              phone: this.ownerData.contactPhone.trim(),
              profilePictureUrl: this.avatarPreviewUrl,
            });
          },
        });
        this.submitting = false;
        this.messageType = 'success';
        this.message = '營主資料已更新';
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '成功',
          detail: '營主資料已更新',
        });
        setTimeout(() => this.router.navigate(['/ownerCenter']), 600);
      },
      error: (err) => {
        this.submitting = false;
        this.messageService.add({
          key: 'top-right',
          severity: 'error',
          summary: '失敗',
          detail: err.error?.message || '請稍後再試',
        });
      },
    });
  }

  private loadOwnerProfile() {
    this.memberService.getProfile().subscribe({
      next: (res) => {
        const profile = res.profileData ?? res.ProfileData;
        const ownerProfile = profile?.ownerProfile ?? profile?.OwnerProfile;

        this.ownerData.companyName = ownerProfile?.companyName ?? ownerProfile?.CompanyName ?? '';
        this.ownerData.realName =
          ownerProfile?.realname ??
          ownerProfile?.realName ??
          ownerProfile?.Realname ??
          this.memberService.getname() ??
          '';
        this.ownerData.idNumber = ownerProfile?.idNumber ?? ownerProfile?.IdNumber ?? '';
        this.ownerData.contactPhone =
          ownerProfile?.contactPhone ??
          ownerProfile?.ContactPhone ??
          this.memberService.getphone() ??
          '';
        this.ownerData.address = ownerProfile?.address ?? ownerProfile?.Address ?? '';
        this.ownerData.bankName = ownerProfile?.bankName ?? ownerProfile?.BankName ?? '';
        this.ownerData.bankAccount = ownerProfile?.bankAccount ?? ownerProfile?.BankAccount ?? '';
        this.ownerData.bankAccountName =
          ownerProfile?.bankAccountName ?? ownerProfile?.BankAccountName ?? '';
        this.avatarPreviewUrl = ownerProfile?.licenseImage ?? ownerProfile?.LicenseImage ?? '';
        this.loadAvatarFallback();
      },
      error: () => {
        this.ownerData.realName = this.memberService.getname() ?? '';
        this.ownerData.contactPhone = this.memberService.getphone() ?? '';
        this.loadAvatarFallback();
      },
    });
  }

  private loadAvatarFallback() {
    this.memberService.OwnerGetPhoto().subscribe({
      next: (res) => {
        const avatarUrl = res.url ?? (res as any).Url;
        if (avatarUrl) {
          this.avatarPreviewUrl = avatarUrl;
        }
      },
    });
  }

  private setError(message: string) {
    this.messageType = 'error';
    this.message = message;
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
