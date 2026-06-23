import { MemberService } from './../Service/member-service';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'profile',
  imports: [RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  name = '';
  email = '';
  phone = '';
  constructor(private memberService: MemberService) {}

  ngOnInit(): void {
    this.name = this.memberService.getname();
    this.email = this.memberService.getemail();
    this.phone = this.memberService.getphone();
  }
  MemberEdit() {
    this.memberService.memberEdit;
  }
}
