import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../Service/member-service';

@Component({
  selector: 'app-owner-register',
  imports: [FormsModule],
  templateUrl: './owner-register.html',
  styleUrl: './owner-register.css',
})
export class OwnerRegister {
  constructor(private memberService: MemberService) {}

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.Name = this.memberService.getname();
  }
  Name = '';
  idNumber = '';
  Address = '';
  ProfilePicture = '';

  GetRegistApi() {}
}
