import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MemberService } from '../Service/member-service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {
  userId = 0;
  token = '';

  newPassword = '';
  confirmPassword = '';

  message = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private memberService: MemberService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.userId = Number(params.get('userId'));
      this.token = params.get('token') || '';

      if (!this.userId || !this.token) {
        this.message = '重設密碼連結無效';
      }
    });
  }

  submit() {
    if (!this.newPassword || !this.confirmPassword) {
      this.message = '請輸入新密碼';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.message = '兩次輸入的密碼不一致';
      return;
    }

    if (this.newPassword.length < 6) {
      this.message = '密碼至少需要 6 碼';
      return;
    }

    this.loading = true;
    this.message = '';

    this.memberService.resetPassword({
      userId: this.userId,
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.message = res.message;
        this.loading = false;

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.message = err.error?.message || '密碼重設失敗';
        this.loading = false;
      }
    });
  }
}