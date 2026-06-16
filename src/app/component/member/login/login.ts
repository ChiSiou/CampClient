import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  constructor(private httpClient: HttpClient) {}

  GetloginApi(para: loginData) {
    return this.httpClient.post<loginData[]>('https://localhost:7011/api/Member', para);
  }
}
