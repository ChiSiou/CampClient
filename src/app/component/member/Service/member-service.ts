import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { LoginResponse } from '../interface/loginResponse';
import { loginData } from '../interface/loginData';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { memberregisterData } from '../interface/memberRegisterData';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { ownerregisterData } from '../interface/ownerRegisterData';
import { profilePhotoResponse } from '../interface/profilePhotoResponse';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private apiUrl = 'https://localhost:7011/api/Member';

  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private http: HttpClient,
    private routes: Router,
    private messageService: MessageService,
  ) {}

  login(data: loginData) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data);
  }
  islogin(route: string) {
    const token = localStorage.getItem('token');

    if (!token) {
      ///沒有token = 未登入 導至登入頁面
      this.routes.navigate(['/login']);
      return false;
    }

    this.routes.navigate([`/${route}`]);
    return true;
  }
  logout() {
    if (this.islogin('')) {
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
  memberregister(data: memberregisterData, file: File) {
    const formData = new FormData();

    formData.append('name', data.Name);
    formData.append('email', data.Email);
    formData.append('phone', data.Phone);
    formData.append('password', data.Password);

    formData.append('file', file, file.name);
    return this.http.post<{ Message: string }>(`${this.apiUrl}/MemberRegister`, formData);
  }
  ownerregister(data: ownerregisterData) {
    const token = localStorage.getItem('token');
    return this.http.post<string>(`${this.apiUrl}/OwnerRegister`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  uploadOwnerProfilePhoto(file: File) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<profilePhotoResponse>(
      `${this.apiUrl}/UploadOwnerProfilePhoto`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }
  getphoto() {
    var id = this.getid();
    return this.http.get<profilePhotoResponse>(`${this.apiUrl}/GetProfilePhoto/${id}`);
  }
  getid() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      return decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    }
  }
  getname() {
    //取得存在localstotage的token反譯出的名字
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      return decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
    }
  }
  getrole() {
    //取得存在localstotage的token反譯出的身分
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      return decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    }
  }
}
