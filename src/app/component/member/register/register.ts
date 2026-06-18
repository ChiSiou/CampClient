import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { memberregisterData } from '../interface/memberRegisterData';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../Service/member-service';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  Name: string = '';
  Phone: string = '';
  Email: string = '';
  Password: string = '';

  constructor(
    private httpClient: HttpClient,
    private memberservice: MemberService,
    private router: Router,
  ) {}

  GetRegistApi(data: memberregisterData) {
    this.memberservice.memberregister(data).subscribe({
      next: (res) => {
        alert('註冊成功');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.log(err);
        alert('註冊失敗');
      },
    });
  }
}
