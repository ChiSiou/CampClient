import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MemberService } from '../../member/Service/member-service';

@Component({
  selector: 'member-center',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './member-center.html',
  styleUrl: './member-center.css',
})
export class MemberCenter {
  name = '';
  profilePhotoUrl = '';
  constructor(private memberservice: MemberService) {}
  ngOnInit(): void {
    this.name = this.memberservice.getname();
    this.memberservice.Usergetphoto().subscribe({
      next: (res) => {
        console.log(res.url);
        this.profilePhotoUrl = res.url;
      },
      error: (err) => {
        return console.log(err);
      },
    });
  }

  logout() {
    this.memberservice.logout();
  }
}
