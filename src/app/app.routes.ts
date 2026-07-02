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
            path: 'itinerary',
            loadComponent: () =>
              import('./component/itinerary-list/itinerary-list').then((m) => m.ItineraryList),
          },
          {
            path: 'notifications',
            loadComponent: () =>
              import('./component/notification-center/notification-center').then((m) => m.NotificationCenter),
          },
          {
            path: 'memberEdit',
            loadComponent: () =>
              import('./component/member/memberedit/memberedit').then((m) => m.Memberedit),
          },
          {
            path: 'liked',
            loadComponent: () => import('./component/liked/liked').then((m) => m.Liked),
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
            path: 'notifications',
            loadComponent: () =>
              import('./component/notification-center/notification-center').then((m) => m.NotificationCenter),
          },
          {
            path: 'income',
            loadComponent: () =>
              import('./component/owner-management/income-dashboard/income-dashboard').then((m) => m.IncomeDashboard),
          },
          {
            path: 'profileEdit',
            loadComponent: () =>
              import('./component/member/owner-profile-edit/owner-profile-edit').then((m) => m.OwnerProfileEdit),
          }, {
            path: 'reviews',
            loadComponent: () =>
              import('./component/owner-management/reviews/owner-reviews').then((m) => m.OwnerReviews),
          },
          {
            path: 'camps/:id',
            loadComponent: () =>
              import('./component/owner-management/camps/edit/camp-edit').then((m) => m.CampEdit),
          },

          // Campground
          { path: 'camps', pathMatch: 'full', loadComponent: () => import('./component/owner-management/camps/camps').then((m) => m.Camps) },
          { path: 'camps/add', pathMatch: 'full', loadComponent: () => import('./component/owner-management/camps/add/camp-add').then((m) => m.CampAdd) },
          { path: 'camps/:campId/edit', pathMatch: 'full', loadComponent: () => import('./component/owner-management/camps/edit/camp-edit').then((m) => m.CampEdit) },
          // Zone
          { path: 'camps/:campId/zones/add', pathMatch: 'full', loadComponent: () => import('./component/owner-management/zones/add/zone-add').then((m) => m.ZoneAdd) },
          { path: 'camps/:campId/zones/:zoneId/edit', pathMatch: 'full', loadComponent: () => import('./component/owner-management/zones/edit/zone-edit').then((m) => m.ZoneEdit) },
          { path: 'camps/:campId/zones', pathMatch: 'full', loadComponent: () => import('./component/owner-management/zones/zones').then((m) => m.Zones) },
          // Site
          { path: 'camps/:campId/zones/:zoneId/sites/add', pathMatch: 'full', loadComponent: () => import('./component/owner-management/sites/add/site-add').then((m) => m.SiteAdd) },
          { path: 'camps/:campId/zones/:zoneId/sites/:siteId/edit', pathMatch: 'full', loadComponent: () => import('./component/owner-management/sites/edit/site-edit').then((m) => m.SiteEdit) },
          { path: 'camps/:campId/zones/:zoneId/sites', pathMatch: 'full', loadComponent: () => import('./component/owner-management/sites/sites').then((m) => m.Sites) },
          { path: '**', loadComponent: () => import('./component/member/profile/owner-profile').then((m) => m.OwnerProfile) },
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
        path: 'itinerary',
        redirectTo: 'member-center/itinerary',
        pathMatch: 'full',
      },
      {
        path: 'notifications',
        redirectTo: 'member-center/notifications',
        pathMatch: 'full',
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
        path: 'reset-password',
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
