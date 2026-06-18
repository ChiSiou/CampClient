import { LoginResponse } from './../interface/loginResponse';
import { loginData } from './../interface/loginData';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { memberregisterData } from '../interface/memberRegisterData';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private apiUrl = 'https://localhost:7011/api/Member';

  constructor(private http: HttpClient) {}

  login(data: loginData) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data);
  }
  memberregister(data: memberregisterData) {
    return this.http.post<string>(`${this.apiUrl}/MemberRegister`, data);
  }

  islogin() {
    const token = localStorage.getItem('token');
    if (token) {
      return true;
    } else {
      return false;
    }
  }
}
