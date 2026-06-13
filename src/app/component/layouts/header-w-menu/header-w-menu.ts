import { Component } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';

@Component({
  selector: 'app-header-w-menu',
  imports: [RouterOutlet, RouterLinkWithHref],
  templateUrl: './header-w-menu.html',
  styleUrl: './header-w-menu.css',
})
export class HeaderWMenu {

}
