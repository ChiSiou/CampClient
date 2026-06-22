import { MemberService } from './../Service/member-service';
import { Component } from '@angular/core';

@Component({
  selector: 'profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  name = '';

  constructor(private memberService: MemberService) {}

  ngOnInit(): void {
    this.name = this.memberService.getname();
  }
}
