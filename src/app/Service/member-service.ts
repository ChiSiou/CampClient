import { LoginResponse } from './../interface/loginResponse';
import { loginData } from './../interface/loginData';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private apiUrl = 'https://localhost:7011/api/Member';

  constructor(private http: HttpClient) {}

  login(data: loginData) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data);
  }
}
