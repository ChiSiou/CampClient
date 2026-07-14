import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MemberService } from '../Service/member-service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css'
})
export class VerifyEmail implements OnInit {
  message = '信箱驗證中...';
  success = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private memberService: MemberService
  ) {}

  ngOnInit(): void {
    const userId = Number(this.route.snapshot.queryParamMap.get('userId'));
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!userId || !token) {
      this.message = '驗證連結錯誤';
      return;
    }

    this.memberService.verifyEmail({ userId, token }).subscribe({
      next: () => {
        this.router.navigate(['/login'], {
          queryParams: { verified: 'success' }
        });
      },
      error: (err) => {
        this.message = err.error?.message || '信箱驗證失敗，請重新寄送驗證信';
      }
    });
  }
}
