import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AppRole } from '../models/domain.models';
import { AuthService } from '../services/auth.service';

/**
 * Guards decide whether a route may open. Each one is a function that returns:
 *   true                    -> allowed
 *   router.parseUrl('/x')   -> not allowed, go to /x instead
 *
 * They are attached in app.routes.ts with `canActivate: [authGuard]`.
 */

/** Blocks pages that need a sign-in, remembering where the user was heading. */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  // An old, expired session may still be sitting in localStorage.
  auth.logout(false);

  // state.url is the page they wanted; login sends them back there afterwards.
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Keeps signed-in users off the landing and login pages. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return router.parseUrl(auth.homeRoute());
  }
  return true;
};

/**
 * Checks the role. The allowed roles come from the route itself:
 *   { path: 'admin', canActivate: [roleGuard], data: { roles: ['admin'] } }
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles: AppRole[] = route.data['roles'] || [];
  const role = auth.role();

  if (role && allowedRoles.includes(role)) {
    return true;
  }
  return router.parseUrl('/forbidden');
};
