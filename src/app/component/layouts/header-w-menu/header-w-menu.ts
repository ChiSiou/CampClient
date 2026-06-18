import { Menu } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { Component, viewChild } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import type { MenuItem, MessageService } from 'primeng/api';

@Component({
  selector: 'app-header-w-menu',
  imports: [RouterOutlet, RouterLink, ButtonModule, Menu],
  templateUrl: './header-w-menu.html',
  styleUrl: './header-w-menu.css',
})
export class HeaderWMenu {
  constructor(private routes: Router) {}
  readonly menu = viewChild.required<Menu>('menu');

  readonly menuItems: MenuItem[] = [
    { label: '我的收藏', icon: 'pi pi-heart', routerLink: '/favorites' },
    { label: '訂單', icon: 'pi pi-receipt', routerLink: '/orders' },
    { label: '行程', icon: 'pi pi-map', routerLink: '/itinerary' },
    { label: '訊息通知', icon: 'pi pi-bell', routerLink: '/notifications' },
    { label: '個人簡介', icon: 'pi pi-id-card', routerLink: '/profile' },
    { label: '帳號設定', icon: 'pi pi-cog', routerLink: '/settings' },
    { label: '登出', icon: 'pi pi-sign-out', command: () => this.logout() },
  ];

  toggleMenu(event: Event) {
    this.menu().toggle(event);
  }
  islogin() {
    var token = localStorage.getItem('token');
    if (token) {
      this.routes.navigate(['/']);
      return true;
    } else {
      this.routes.navigate(['/login']);
      return false;
    }
  }
  logout() {
    if (this.islogin()) {
      localStorage.removeItem('token');
      this.routes.navigate(['/login']);
    } else {
      alert('請先登入');
    }
  }
}
