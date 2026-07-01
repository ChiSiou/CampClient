import { Routes } from '@angular/router';
import { authGuard } from './component/member/Service/authguard';

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
        loadComponent: () => import('./component/reviews/popup/popup').then((m) => m.Popup),
      },
      {
        path: 'forum',
        loadComponent: () => import('./component/forum/forum/forum').then((m) => m.Forum),
      },
      {
        path: 'post/:id',
        loadComponent: () => import('./component/forum/post/post').then((m) => m.Post),
      },
      {
        path: 'post',
        loadComponent: () => import('./component/forum/add-post/add-post').then((m) => m.AddPost),
      },
      {
        path: 'member-center',
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        loadComponent: () =>
          import('./component/layouts/memberCenter/member-center').then((m) => m.MemberCenter),
        children: [
          {
            path: 'orders',
            loadComponent: () => import('./component/member/orders/orders').then((m) => m.Orders),
          },
          {
            path: 'memberEdit',
            loadComponent: () =>
              import('./component/member/memberedit/memberedit').then((m) => m.Memberedit),
          },
          {
            path: '**',
            loadComponent: () =>
              import('./component/member/profile/profile').then((m) => m.Profile),
          },
        ],
      },
      {
        path: 'ownerCenter',
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        loadComponent: () =>
          import('./component/layouts/owner-center/owner-center').then((m) => m.OwnerCenter),
        children: [
          {
            path: 'camps',
            pathMatch: 'full',
            loadComponent: () =>
              import('./component/owner-management/camps/camps').then((m) => m.Camps),
          },
          {
            path: 'camps/add',
            loadComponent: () =>
              import('./component/owner-management/camps/add/camp-add').then((m) => m.CampAdd),
          },
          {
            path: '**',
            loadComponent: () =>
              import('./component/member/profile/owner-profile').then((m) => m.OwnerProfile),
          },
        ],
      },

      {
        path: 'search',
        loadComponent: () => import('./component/search/search').then((m) => m.Search),
      },
      {
        path: 'attraction/:id',
        loadComponent: () =>
          import('./component/attraction-detail/attraction-detail').then((m) => m.AttractionDetail),
      },
      {
        path: 'camp/:id',
        loadComponent: () =>
          import('./component/camp-detail/camp-detail').then((m) => m.CampDetail),
      },
      {
        path: 'camp/:id/zone/:zoneId',
        loadComponent: () =>
          import('./component/camp-detail/zone-detail/zone-detail').then((m) => m.ZoneDetail),
      },
      {
        path: 'notifications',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./component/notification-center/notification-center').then((m) => m.NotificationCenter),
      },
      {
        path: 'checkout',
        loadComponent: () => import('./component/checkout/checkout').then((m) => m.Checkout),
      },
      {
        path: 'payment/result',
        loadComponent: () =>
          import('./component/payment-result/payment-result').then((m) => m.PaymentResult),
      },
      {
        path: 'camp/:id/rental',
        loadComponent: () => import('./component/camping-rental/camping-rental').then(m => m.CampingRentalComponent)
      },
      {
        path: 'camp/:id/rental/equipment/:productId',
        loadComponent: () =>
          import('./component/camping-rental/equipment-detail/equipment-detail').then(
            (m) => m.EquipmentDetailComponent,
          ),
      }
    ]
  },
  {
  path: '',
  loadComponent: () => import('./component/layouts/member/member').then((m) => m.Member),
  children: [
    {
      path: 'register',
      loadComponent: () =>
        import('./component/member/register/register').then((m) => m.Register),
    },
    {
      path: 'verify-email',
      loadComponent: () =>
        import('./component/member/verify-email/verify-email').then((m) => m.VerifyEmail),
    },
    {
      path: 'resend-verify-email',
      loadComponent: () =>
        import('./component/member/verify-email/resend-verification-email').then((m) => m.ResendVerificationEmail),
    },
    {
      path: 'login',
      loadComponent: () =>
        import('./component/member/login/login').then((m) => m.Login),
    },
    {
      path: 'forgot-password',
      loadComponent: () =>
        import('./component/member/forgot-password/forgot-password').then((m) => m.ForgotPassword),
    },
    {
      path:'reset-password',
      loadComponent: () =>
      import('./component/member/reset-password/reset-password').then((m) => m.ResetPassword),
    },
    {
      path: 'owner-register',
      canActivate: [authGuard],
      loadComponent: () =>
        import('./component/member/register/owner-register')
          .then((m) => m.OwnerRegister),
    },
  ],
}
];
