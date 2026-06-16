import { Component, viewChild } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Menu } from 'primeng/menu';
import type { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-header-w-menu',
  imports: [RouterOutlet, RouterLink, ButtonModule, Menu],
  templateUrl: './header-w-menu.html',
  styleUrl: './header-w-menu.css',
})
export class HeaderWMenu {
  readonly menu = viewChild.required<Menu>('menu');

  readonly menuItems: MenuItem[] = [
    { label: '我的收藏', icon: 'pi pi-heart', routerLink: '/favorites' },
    { label: '訂單', icon: 'pi pi-receipt', routerLink: '/orders' },
    { label: '行程', icon: 'pi pi-map', routerLink: '/itinerary' },
    { label: '訊息通知', icon: 'pi pi-bell', routerLink: '/notifications' },
    { label: '個人簡介', icon: 'pi pi-id-card', routerLink: '/profile' },
    { label: '帳號設定', icon: 'pi pi-cog', routerLink: '/settings' },
  ];

  toggleMenu(event: Event) {
    this.menu().toggle(event);
  }
}
