import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MemberService } from '../Service/member-service';
import { ChatService } from '../../../services/chat.service';

@Component({
  selector: 'app-owner-profile',
  imports: [RouterLink,DatePipe],
  templateUrl: './owner-profile.html',
  styleUrl: './owner-profile.css',
})
export class OwnerProfile {
 name = '';
 email ='';
ownerprofilephoto = '';
createdAt ='';

constructor(private memberservice :MemberService , private chatService :ChatService){}
 onActivate(component: any) {
    console.log('目前載入的子頁面：', component.constructor.name);
  }
ngOnInit():void{
   this.memberservice.getProfile().subscribe({
    next:(res)=>{
      this.name = res.profileData.name;
      this.email = res.profileData.email;
      console.log(res.profileData.ownerProfile.createdAt);
      this.createdAt = res.profileData.ownerProfile.createdAt;
    }
   });
  this.memberservice.OwnerGetPhoto().subscribe({
    next:(res)=>{
      
      this.ownerprofilephoto = res.url;
    },
    error:(err)=>{
console.log(err.message);
    }
  })
 }
  contactCustomer(customerId: number, customerName: string) {
    this.chatService.openChatWith(customerId, customerName);
  }
}
