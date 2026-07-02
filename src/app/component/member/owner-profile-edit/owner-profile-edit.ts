import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MemberService } from '../Service/member-service';

@Component({
  selector: 'app-owner-profile-edit',
  imports: [FormsModule, RouterLink],
  templateUrl: './owner-profile-edit.html',
  styleUrl: './owner-profile-edit.css',
})
export class OwnerProfileEdit implements OnInit {
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
        this.submitting = false;
        this.messageType = 'success';
        this.message = '營主資料已更新';
        setTimeout(() => this.router.navigate(['/ownerCenter']), 600);
      },
      error: (err) => {
        this.submitting = false;
        this.setError(err.error?.message ?? '營主資料更新失敗');
      },
    });
  }

  private loadOwnerProfile() {
    this.memberService.getProfile().subscribe({
      next: (res) => {
        const profile = res.profileData ?? res.ProfileData;
        const ownerProfile = profile?.ownerProfile ?? profile?.OwnerProfile;

        this.ownerData.companyName = ownerProfile?.companyName ?? ownerProfile?.CompanyName ?? '';
        this.ownerData.realName = ownerProfile?.realname ?? ownerProfile?.realName ?? ownerProfile?.Realname ?? this.memberService.getname() ?? '';
        this.ownerData.idNumber = ownerProfile?.idNumber ?? ownerProfile?.IdNumber ?? '';
        this.ownerData.contactPhone = ownerProfile?.contactPhone ?? ownerProfile?.ContactPhone ?? this.memberService.getphone() ?? '';
        this.ownerData.address = ownerProfile?.address ?? ownerProfile?.Address ?? '';
        this.ownerData.bankName = ownerProfile?.bankName ?? ownerProfile?.BankName ?? '';
        this.ownerData.bankAccount = ownerProfile?.bankAccount ?? ownerProfile?.BankAccount ?? '';
        this.ownerData.bankAccountName = ownerProfile?.bankAccountName ?? ownerProfile?.BankAccountName ?? '';
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
}
