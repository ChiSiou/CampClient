import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  imports: [],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  constructor(private httpClient: HttpClient) { }

  regist() {

    let user = {

      "Account": "test123",
      "Password": "testpassword",
      "Phone": "0936035715",
      "Email": "test123@gmail.com",
      "Name": "測試"
    }
    let apiurl ="https://localhost:7011/api/Member";

    this.httpClient.post(apiurl,user);
  }
}

