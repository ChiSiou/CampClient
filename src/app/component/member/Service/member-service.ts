import { MessageService } from 'primeng/api';
import { LoginResponse } from '../interface/loginResponse';
import { loginData } from '../interface/loginData';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { memberregisterData } from '../interface/memberRegisterData';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private apiUrl = 'https://localhost:7011/api/Member';

  constructor(
    private http: HttpClient,
    private routes: Router,
    private messageService: MessageService,
  ) {}

  login(data: loginData) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data);
  }

  islogin() {
    var token = localStorage.getItem('token');
    if (token) {
      this.routes.navigate(['/']);
      return true;
    } else {
      this.routes.navigate(['/login']);
      return false;
    }
  }
  logout() {
    if (this.islogin()) {
      localStorage.removeItem('token');
      this.routes.navigate(['/login']);
    } else {
      this.messageService.add({
        key: 'top-right',
        severity: 'error',
        summary: '登出失敗',
        detail: '請先登入',
      });
    }
  }
  memberregister(data: memberregisterData) {
    return this.http.post<string>(`${this.apiUrl}/MemberRegister`, data);
  }
  getname() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      return decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
    }
  }
  getrole() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      return decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    }
  }
}
