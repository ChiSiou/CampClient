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
        path: 'review/add',
        loadComponent: () => import('./component/reviews/popup/popup').then(m => m.Popup)
      },
      {
        path: 'forum',
        loadComponent: () => import('./component/forum/forum/forum').then(m => m.Forum),
      },
      {
        path: 'post/:id',
        loadComponent: () => import('./component/forum/post/post').then((m) => m.Post),
      },
      {
        path: 'member-center',
        loadComponent: () => import('./component/member/memberCenter/member-center').then(m => m.MemberCenter)
      },
      {
        path: 'search',
        loadComponent: () => import('./component/search/search').then(m => m.Search)
      },
      {
        path: 'camp/:id',
        loadComponent: () => import('./component/camp-detail/camp-detail').then(m => m.CampDetail)
      },
      {
        path: 'checkout',
        loadComponent: () => import('./component/checkout/checkout').then(m => m.Checkout)
      },
      {
        path: 'payment/result',
        loadComponent: () => import('./component/payment-result/payment-result').then(m => m.PaymentResult)
      },
    ]
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
