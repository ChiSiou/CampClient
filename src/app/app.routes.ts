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
        path: 'review',
        loadComponent: () => import('./component/reviews/review/review').then((m) => m.Review),
      },
      {
        path: 'review-popup',
        loadComponent: () => import('./component/reviews/popup/popup').then((m) => m.Popup),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./component/member/member').then((m) => m.Member),
    children: [
      {
        path: 'register',
        loadComponent: () => import('./component/member/register/register').then((m) => m.Register),
      },
      {
        path: 'login',
        loadComponent: () => import('./component/member/login/login').then((m) => m.Login),
      },
      {
        path: 'owner-register',
        loadComponent: () =>
          import('./component/member/register/owner-register').then((m) => m.OwnerRegister),
      },
    ],
  },
];
