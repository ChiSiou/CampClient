import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./component/layouts/header-w-menu/header-w-menu').then(m => m.HeaderWMenu),
    children: [
      {
        path: '',
        loadComponent: () => import('./component/home/home').then(m => m.Home)
      },
      {
        path: 'member',
        loadComponent: () => import('./component/member/member').then(m => m.Member)
      },
      {
        path: 'review',
        loadComponent: () => import('./component/reviews/review/review').then(m => m.Review)
      },
      {
        path: 'review-popup',
        loadComponent: () => import('./component/reviews/popup/popup').then(m => m.Popup)
      }
    ]

  }
];


