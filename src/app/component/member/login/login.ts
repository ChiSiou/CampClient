import { HttpClient } from '@angular/common/http';
import { loginData } from '../interface/loginData';
import { MemberService } from '../Service/member-service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ButtonModule, ToastModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email: string = '';
  password: string = '';
  emailconfirmed: boolean = false;
  token = localStorage.getItem('token');

  constructor(
    private httpClient: HttpClient,
    private memberService: MemberService,
    private routes: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
  ) { }

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
        this.routes.navigateByUrl(returnUrl || '/');
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
        }
        else {
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
    this.routes.navigate(['resend-verify-email'])
  }
}
