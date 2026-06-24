import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MemberService } from './member-service';

export const authGuard: CanActivateFn = (route, state) => {
  const memberservice = inject(MemberService);
  const router = inject(Router);

  if (memberservice.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: {
      returnUrl: state.url,
    },
  });
};
