import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MemberService } from '../Service/member-service';

@Component({
  selector: 'app-resend-verification-email',
  imports: [FormsModule, RouterLink],
  templateUrl: './resend-verification-email.html',
  styleUrl: './resend-verification-email.css',
})
export class ResendVerificationEmail {
  email = '';
  message = '';
  success = false;
  loading = false;

  constructor(private memberService: MemberService) {}

  submit() {
    if (!this.email.trim()) {
      this.message = '請輸入 Email';
      this.success = false;
      return;
    }

    this.loading = true;
    this.message = '';
    this.success = false;

    this.memberService.reSendConfirmedEmail({ email: this.email }).subscribe({
      next: (res) => {
        this.message = res.message;
        this.success = true;
        this.loading = false;
      },
      error: (err) => {
        this.message = err.error?.message || '寄送失敗，請稍後再試';
        this.success = false;
        this.loading = false;
      },
    });
  }
}
