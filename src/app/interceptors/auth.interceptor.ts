import { HttpInterceptorFn } from '@angular/common/http';

// 每個 HTTP 請求送出前，如果本機有登入 token 就自動帶上 Authorization header
// 沒有 token 也照樣放行，後端有沒有檢查（[Authorize]）由後端自己決定，這裡只負責「有就帶上」
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
