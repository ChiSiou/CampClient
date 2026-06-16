import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./component/layouts/header-w-menu/header-w-menu').then((m) => m.HeaderWMenu),
    children: [
      {
        path: '',
        loadComponent: () => import('./component/home/home').then((m) => m.Home),
      },
      {
        path: 'member',
        loadComponent: () => import('./component/member/member').then((m) => m.Member),
      },

      {
        path: 'register',
        loadComponent: () => import('./component/member/register/register').then((m) => m.Register),
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () => import('./component/member/login/login').then((m) => m.Login),
  },
];
