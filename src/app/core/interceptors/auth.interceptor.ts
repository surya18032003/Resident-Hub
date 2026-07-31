import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

/**
 * An interceptor sits between the app and the network: every request passes
 * through it on the way out, and every response on the way back.
 *
 * This one adds the login token to protected requests, so no service ever has
 * to remember to send it. Registered in app.config.ts.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  // /login is how you GET a token, so it must not carry one.
  const isLoginRequest = request.url.endsWith('/login');

  if (!token || isLoginRequest) {
    return next(request); // send it unchanged
  }

  // Requests are read-only, so we send a copy with the extra header.
  const withToken = request.clone({
    setHeaders: { Authorization: 'Bearer ' + token },
  });

  return next(withToken);
};
