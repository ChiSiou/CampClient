import { HttpClient } from '@angular/common/http';
import { loginData } from '../../../interface/loginData';
import { MemberService } from '../../../Service/member-service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ButtonModule, ToastModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email: string = '';
  password: string = '';

  constructor(
    private httpClient: HttpClient,
    private memberService: MemberService,
    private routes: Router,
  ) {}

  GetloginApi(para: loginData) {
    const data = {
      email: this.email,
      password: this.password,
    };
    this.memberService.login(data).subscribe({
      next: (res) => {
        console.log('response', res);
        localStorage.setItem('token', res.token);
        cookieStore.set('token', res.token);
        alert('登入成功');
        this.routes.navigate(['/']);
      },
      error: (err) => {
        console.log(err);
        alert('帳號或密碼錯誤');
      },
    });
  }
}
