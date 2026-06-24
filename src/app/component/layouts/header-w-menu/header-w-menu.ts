import { Menu } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { Component, viewChild } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { MenuItem, MessageService } from 'primeng/api';
import { MemberService } from '../../member/Service/member-service';
@Component({
  selector: 'app-header-w-menu',
  imports: [RouterOutlet, RouterLink, ButtonModule, Menu],
  providers: [MemberService],
  templateUrl: './header-w-menu.html',
  styleUrl: './header-w-menu.css',
})
export class HeaderWMenu {
  constructor(
    private routes: Router,
    private memberservice: MemberService,
    private messageService: MessageService,
  ) {}

  username = '';
  userrole = '';
  activeUserRole = '';

  ngOnInit() {
    this.username = this.memberservice.getname();
    this.userrole = this.memberservice.getrole();
    this.activeUserRole = this.memberservice.getActiveRole();
    const token = localStorage.getItem('token');
    if (token != null) {
      const decoded: any = jwtDecode(token);
      console.log(decoded);
    }
  }

  readonly menu = viewChild.required<Menu>('menu');

  readonly menuItems: MenuItem[] = [
    { label: '我的收藏', icon: 'pi pi-heart', routerLink: '/favorites' },
    { label: '訂單', icon: 'pi pi-receipt', routerLink: '/orders' },
    { label: '行程', icon: 'pi pi-map', routerLink: '/itinerary' },
    { label: '訊息通知', icon: 'pi pi-bell', routerLink: '/notifications' },
    { label: '個人簡介', icon: 'pi pi-id-card', routerLink: '/profile' },
    { label: '帳號設定', icon: 'pi pi-cog', routerLink: '/settings' },
    { label: '登出', icon: 'pi pi-sign-out', command: () => this.memberservice.logout() },
  ];

  toggleMenu(event: Event) {
    this.menu().toggle(event);
  }

  Center() {
    if (this.activeUserRole === 'Owner') {
      this.routes.navigate(['/ownerCenter']);
    } else if (this.activeUserRole === 'User') {
      this.routes.navigate(['/member-center']);
    } else {
      this.routes.navigate(['/login']);
    }
  }
  switchRole(roleName: string) {
    this.memberservice.switchRole(roleName).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('roles', JSON.stringify(res.roles));
        localStorage.setItem('activeRole', res.activeRole);

        // 重點：同步更新畫面變數
        this.activeUserRole = res.activeRole;
        this.userrole = res.roles;
        localStorage.setItem('activeRole', res.activeRole);

        if (res.activeRole === 'Owner') {
          this.routes.navigate(['/ownerCenter']);
        } else if (res.activeRole === 'User') {
          this.routes.navigate(['/member-center']);
        } else {
          this.routes.navigate(['/']);
        }
      },
      error: (err) => {
        console.log(err);
        this.messageService.add({
          key: 'top-right',
          severity: 'error',
          summary: `登入失敗`,
          detail: '請先註冊成為營主',
        });
        this.routes.navigate(['owner-register']);
      },
    });
  }
}
