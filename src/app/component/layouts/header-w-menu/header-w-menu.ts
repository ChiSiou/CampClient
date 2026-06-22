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
    private messageService: MessageService
  ) { }
  username = '';
  userRole = '';
  ngOnInit() {
    this.username = this.memberservice.getname();
    this.userRole = this.memberservice.getrole();
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

  islogin(url:string) { return this.memberservice.islogin(url) };

  ownerislogin(route: string) {
    const token = localStorage.getItem('token');

    if (!token) {
      this.messageService.add({
        key: 'top-right',
        severity: 'error',
        summary: '失敗',
        detail: '請先登入',
      });

      return;
    }

    this.routes.navigate([`/${route}`]);
  }
}

