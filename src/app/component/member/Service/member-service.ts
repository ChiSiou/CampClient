import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { loginData } from '../interface/loginData';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { memberregisterData } from '../interface/memberRegisterData';
import { Router, RouterLink } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { ownerregisterData } from '../interface/ownerRegisterData';
import { profilePhotoResponse } from '../interface/profilePhotoResponse';
import { Memberedit } from '../memberedit/memberedit';
import { MemberEdit } from '../interface/MemberEdit';
import { switchRoleResponse } from '../interface/switchRoleResponse';
import { OrderList } from '../interface/orderList';
import { LoginServiceResult, ServiceResult } from '../interface/ServiceResult';
import { OwnerOrderList } from '../interface/ownerOrderList';
import { BehaviorSubject, tap } from 'rxjs';

export interface CurrentMemberProfile {
  name?: string;
  email?: string;
  phone?: string;
  profilePictureUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private apiUrl = 'https://localhost:7011/api/Member';
  private currentProfileSubject = new BehaviorSubject<CurrentMemberProfile | null>(null);
  currentProfile$ = this.currentProfileSubject.asObservable();

  private logoutTimer: any;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private http: HttpClient,
    private routes: Router,
    private messageService: MessageService,
  ) {}

  login(data: loginData) {
    return this.http.post<LoginServiceResult>(`${this.apiUrl}/login`, data);
  }
  clearLoginData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    localStorage.removeItem('activeRole');
    localStorage.removeItem('currentProfile');

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
  } //移除token
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');

    if (!token) {
      return false;
    }

    try {
      const decoded = this.decodeToken();

      if (!decoded?.exp) {
        this.clearLoginData();
        return false;
      }

      const now = Math.floor(Date.now() / 1000);

      if (decoded.exp <= now) {
        this.clearLoginData();
        return false;
      }

      return true;
    } catch {
      this.clearLoginData();
      return false;
    }
  } //驗證是否有token
  logout() {
    if (this.isAuthenticated()) {
      this.clearLoginData();
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
  startTokenTimer(): void {
    const token = localStorage.getItem('token');

    if (!token) return;

    try {
      const decoded = this.decodeToken();

      if (!decoded?.exp) {
        this.logout();
        return;
      }

      const expireTime = decoded.exp * 1000;
      const now = Date.now();
      const timeout = expireTime - now;

      if (timeout <= 0) {
        this.logout();
        return;
      }

      this.logoutTimer = setTimeout(() => {
        this.logout();
      }, timeout);
    } catch {
      this.logout();
    }
  } //token計時器
  islogin() {
    const token = localStorage.getItem('token');

    if (!token) {
      ///沒有token = 未登入 導至登入頁面
      this.routes.navigate(['/login']);
      return false;
    } else {
      try {
        const decoded = this.decodeToken();
        if (!decoded?.exp) {
          this.logout();
          return false;
        }
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
          this.logout();
          return false;
        }
        return true;
      } catch {
        this.logout();
        return false;
      }
    }
  }
  switchRole(roleName: string) {
    return this.http.post<switchRoleResponse>(`${this.apiUrl}/SwitchRole`, {
      roleName: roleName,
    });
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
  ownerregister(data: ownerregisterData, file: File) {
    const formData = new FormData();

    formData.append('idNumber', data.idNumber);
    formData.append('realname', data.realName);
    formData.append('address', data.address);
    formData.append('companyName', data.companyName);
    formData.append('contactPhone', data.contactPhone);
    formData.append('bankName', data.bankName);
    formData.append('bankAccount', data.bankAccount);
    formData.append('bankAccountName', data.bankAccountName);
    formData.append('file', file, file.name);

    return this.http.post<ServiceResult>(`${this.apiUrl}/OwnerRegister`, formData);
  }

  ownerEdit(data: FormData) {
    return this.http.put<ServiceResult>(`${this.apiUrl}/OwnerEdit`, data);
  }

  uploadOwnerProfilePhoto(file: File) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<profilePhotoResponse>(`${this.apiUrl}/UploadOwnerProfilePhoto`, formData);
  }
  getorder() {
    return this.http.get<OrderList[]>(`${this.apiUrl}/GetOrder`);
  }
  getOwnerRecentOrders() {
    return this.http.get<OwnerOrderList[]>('https://localhost:7011/api/OwnerOrder/recent');
  }
  getProfile() {
    return this.http.get<any>(`${this.apiUrl}/GetProfile`).pipe(
      tap((res) => {
        const profile = res.profileData ?? res.ProfileData;
        if (profile) {
          const ownerProfile = profile.ownerProfile ?? profile.OwnerProfile;
          const activeRole = profile.activeRole ?? profile.ActiveRole ?? this.getActiveRole();
          const displayName =
            activeRole === 'Owner'
              ? (ownerProfile?.realname ?? ownerProfile?.realName ?? ownerProfile?.Realname ?? profile.name ?? profile.Name)
              : (profile.name ?? profile.Name);

          this.updateCurrentProfile({
            name: displayName,
            email: profile.email ?? profile.Email,
            phone:
              activeRole === 'Owner'
                ? (ownerProfile?.contactPhone ?? ownerProfile?.ContactPhone ?? profile.phone ?? profile.Phone)
                : (profile.phone ?? profile.Phone),
            profilePictureUrl: profile.profilePictureUrl ?? profile.ProfilePictureUrl,
          });
        }
      }),
    );
  }
  updateCurrentProfile(profile: CurrentMemberProfile) {
    const nextProfile = {
      ...(this.currentProfileSubject.value ?? {}),
      ...profile,
    };

    this.currentProfileSubject.next(nextProfile);

    localStorage.setItem('currentProfile', JSON.stringify(nextProfile));
    window.dispatchEvent(new CustomEvent('currentProfileChanged', { detail: nextProfile }));
  }
  Usergetphoto() {
    var id = this.getid();
    return this.http.get<profilePhotoResponse>(`${this.apiUrl}/UserGetProfilePhoto/${id}`);
  }
  OwnerGetPhoto() {
    var id = this.getid();
    return this.http.get<profilePhotoResponse>(`${this.apiUrl}/OwnerGetProfilePhoto/${id}`);
  }
  memberEdit(data: FormData) {
    return this.http.put<{ message: string }>(`${this.apiUrl}/MemberEdit`, data);
  }
  verifyEmail(data: { userId: number; token: string }) {
    return this.http.post<any>(`${this.apiUrl}/VerifyEmail`, data);
  }
  forgotPassword(data: { email: string }) {
    return this.http.post<any>(`${this.apiUrl}/ForgetPassword`, data);
  }
  reSendConfirmedEmail(data: { email: string }) {
    return this.http.post<any>(`${this.apiUrl}/ReSendConfirmedEmail`, data);
  }
  resetPassword(data: { userId: number; token: string; newPassword: string }) {
    return this.http.post<any>(`${this.apiUrl}/ResetPassword`, data);
  }
  googleLogin(data: { credential: string }) {
    return this.http.post<any>(`${this.apiUrl}/GoogleLogin`, data);
  }
  getActiveRole() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = this.decodeToken();
      return decoded?.['activeRole'];
    }
  }
  getemail() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = this.decodeToken();
      return decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
    }
  }
  getphone() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = this.decodeToken();
      return decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone'];
    }
  }
  getid() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = this.decodeToken();
      return decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    }
  }
  getname() {
    //取得存在localstotage的token反譯出的名字
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = this.decodeToken();
      return decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
    }
  }
  getrole() {
    //取得存在localstotage的token反譯出的身分
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = this.decodeToken();
      return decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    }
  }

  private decodeToken(): any | undefined {
    const token = localStorage.getItem('token');

    if (!token) {
      return undefined;
    }

    try {
      return jwtDecode(token);
    } catch {
      this.clearLoginData();
      return undefined;
    }
  }
}
