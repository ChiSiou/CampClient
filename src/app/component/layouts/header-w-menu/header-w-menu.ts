import { MemberService } from './../../../Service/member-service';
import { Menu } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { Component, viewChild } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import type { MenuItem } from 'primeng/api';
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
  ) {}
  ngOnInit() {
    console.log(this.memberservice.getname());
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

  islogin = () => this.memberservice.islogin();
}
