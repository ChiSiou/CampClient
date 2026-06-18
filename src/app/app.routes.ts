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
        path: 'review',
        loadComponent: () => import('./component/reviews/review/review').then((m) => m.Review),
      },
      {
        path: 'review/add',
        loadComponent: () => import('./component/reviews/popup/popup').then(m => m.Popup)
      },
      {
        path: 'forum',
        loadComponent: () => import('./component/forum/forum/forum').then(m => m.Forum)
      }
    ]
  },

  {
    path: 'register',
    loadComponent: () => import('./component/member/register/register').then((m) => m.Register),
  },

  {
    path: 'login',
    loadComponent: () => import('./component/member/login/login').then((m) => m.Login),
  },
];
