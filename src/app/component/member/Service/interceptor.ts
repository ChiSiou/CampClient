import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { MemberService } from './member-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const memberservice = inject(MemberService);
  const router = inject(Router);

  const token = localStorage.getItem('token');

  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        memberservice.clearLoginData();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
