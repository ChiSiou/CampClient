import { HttpClient } from '@angular/common/http';
import { loginData } from '../interface/loginData';
import { MemberService } from '../Service/member-service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EyeIcon, EyeSlashIcon } from 'primeng/icons';

declare const google: any;
@Component({
  selector: 'app-login',
  imports: [FormsModule, ButtonModule, ToastModule, RouterLink, EyeIcon, EyeSlashIcon],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly googleClientId =
    '267006894048-afj656rbpr4pvfvl5d0krsk3736maeb5.apps.googleusercontent.com';

  email: string = '';
  password: string = '';
  emailconfirmed: boolean = false;
  token = localStorage.getItem('token');

  constructor(
    private httpClient: HttpClient,
    private memberService: MemberService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
  ) {}

  ngAfterViewInit(): void {
    if (typeof google === 'undefined' || !google.accounts?.id) {
      this.messageService.add({
        key: 'top-right',
        severity: 'error',
        summary: 'Google 登入暫時無法使用',
        detail: 'Google 登入服務尚未載入，請重新整理後再試',
      });
      return;
    }

    const googleButton = document.getElementById('googleSignInDiv');

    if (!googleButton) {
      return;
    }

    google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (response: any) => {
        this.handleGoogleLogin(response);
      },
    });
    google.accounts.id.renderButton(googleButton, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 280,
    });
  }

  handleGoogleLogin(response: any): void {
    const credential = response?.credential;

    if (!credential) {
      this.messageService.add({
        key: 'top-right',
        severity: 'error',
        summary: 'Google 登入失敗',
        detail: '未取得 Google 登入憑證，請再試一次',
      });
      return;
    }

    this.memberService.googleLogin({ credential }).subscribe({
      next: (res) => {
        if (!res.success) {
          this.messageService.add({
            key: 'top-right',
            severity: 'error',
            summary: '登入失敗',
            detail: res.message,
          });
          return;
        }

        localStorage.setItem('token', res.loginResponse.token);
        localStorage.setItem('roles', JSON.stringify(res.loginResponse.roles));
        localStorage.setItem('activeRole', res.loginResponse.activeRole);

        this.memberService.startTokenTimer();

        const name = this.memberService.getname();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: 'Google 登入成功',
          detail: name ? '歡迎回來 ' + name : '歡迎回來',
        });

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || '/member-center');
      },
      error: (err) => {
        this.messageService.add({
          key: 'top-right',
          severity: 'error',
          summary: 'Google 登入失敗',
          detail: err.error?.message || '請稍後再試',
        });
      },
    });
  }

  guestLogin() {
    this.router.navigate(['/']);
  }

  login(data: loginData) {
    this.memberService.login(data).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.loginResponse.token);
        localStorage.setItem('roles', JSON.stringify(res.loginResponse.roles));
        localStorage.setItem('activeRole', res.loginResponse.activeRole);
        ///把後端回傳的 JWT token 存到瀏覽器的 localStorage 裡面
        this.memberService.startTokenTimer();
        ///token過期時間開始計時
        var name = this.memberService.getname();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '登入成功',
          detail: '歡迎回來 ' + name,
        });
        // 有 returnUrl 就導回原本在做的事（例如結帳頁），沒有才回首頁
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || '/');
      },
      error: (err) => {
        if (err.error.message === '信箱尚未驗證，請先完成信箱驗證') {
          this.messageService.add({
            key: 'top-right',
            severity: 'error',
            summary: `登入失敗`,
            detail: '信箱尚未驗證，請先完成信箱驗證',
          });

          this.emailconfirmed = true;
          console.log(this.emailconfirmed);
        } else {
          console.log(err);
          this.messageService.add({
            key: 'top-right',
            severity: 'error',
            summary: `登入失敗`,
            detail: '帳號或密碼錯誤',
          });
        }
      },
    });
  }

  Resendpage() {
    this.router.navigate(['resend-verify-email']);
  }
}
