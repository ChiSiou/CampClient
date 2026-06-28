import { Component } from '@angular/core';
import { MemberService } from '../Service/member-service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {

  email = '';
  message = '';
  loading = false;
  constructor(private memberservice: MemberService) { }

  submit() {
    if (!this.email.trim()) {
      this.message = "請輸入Email";
      return;
    }
    this.loading = true;
    this.message = "";
    this.memberservice.forgotPassword({email:this.email}).subscribe({
      next:(res)=>{
        this.message = res.message,
        this.loading = false;
      },
      error:(err)=>{
        this.message = err.error.message ||'發送失敗，請稍後再試';
        this.loading = false;
      }
      
    })
      
    
  }
 
}

