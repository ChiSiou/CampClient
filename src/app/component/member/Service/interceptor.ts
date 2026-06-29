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
        // 帶上 returnUrl，登入完成後才能導回原本在做的事（例如結帳頁），
        // 不然使用者登入後永遠被丟回首頁，選位/填好的資料都要憑記憶手動找回去
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }

      return throwError(() => error);
    }),
  );
};
