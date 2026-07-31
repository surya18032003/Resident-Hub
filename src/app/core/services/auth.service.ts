import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { JwtPayload } from '../models/api.models';
import { AppRole, LoginRequest, Session } from '../models/domain.models';
import { ApiService } from './api.service';

/**
 * Reads the three fields we need out of a JWT.
 *
 * A JWT is three chunks joined by dots: header.payload.signature. The middle
 * chunk is Base64 text holding JSON, so we decode it with the browser's atob().
 */
function decodeToken(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    // JWTs use a URL-safe Base64 variant, so swap the two different characters
    // back and pad the string to a length the browser accepts.
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 = base64 + '=';
    }
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/**
 * Who is signed in, and how to sign in or out.
 *
 * Because this service is `providedIn: 'root'`, Angular creates exactly one of
 * it and hands the same instance to every component that asks for it.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  /** null when nobody is signed in. */
  session: Session | null = this.readSavedSession();

  /** true when there is a session and its token has not expired yet. */
  isLoggedIn(): boolean {
    return this.session !== null && this.session.expiresAt > Date.now();
  }

  role(): AppRole | null {
    return this.session ? this.session.role : null;
  }

  isAdmin(): boolean {
    return this.role() === 'admin';
  }

  email(): string {
    return this.session ? this.session.email : '';
  }

  token(): string | null {
    return this.session ? this.session.token : null;
  }

  /** "priya.sharma@x.com" becomes "Priya Sharma". The API has no name field. */
  displayName(): string {
    const email = this.email();
    if (!email) {
      return '';
    }
    const beforeAt = email.split('@')[0];
    const words = beforeAt.split(/[._-]+/).filter((word) => word.length > 0);
    const capitalised = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
    return capitalised.join(' ');
  }

  /** First letters of the display name, shown inside the round avatar. */
  initials(): string {
    const name = this.displayName() || this.email();
    return name
      .split(' ')
      .filter((word) => word.length > 0)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  }

  /** Where this role should land after signing in. */
  homeRoute(): string {
    return this.isAdmin() ? '/admin/dashboard' : '/resident/dashboard';
  }

  /**
   * Calls POST /login. Components subscribe to the result:
   *   auth.login(value).subscribe({ next: ..., error: ... })
   */
  login(credentials: LoginRequest): Observable<Session> {
    return this.api.post('login', credentials).pipe(
      map((response) => this.buildSession(response.data, credentials.email)),
      tap((session) => this.saveSession(session)),
    );
  }

  logout(goToLogin = true): void {
    localStorage.removeItem(environment.authStorageKey);
    this.session = null;
    if (goToLogin) {
      this.router.navigate(['/login']);
    }
  }

  private buildSession(data: { token: string; user_type: string }, email: string): Session {
    const payload = decodeToken(data.token);
    const userType = data.user_type || (payload ? payload.user_type : 'user');

    return {
      token: data.token,
      userType: userType,
      // The API calls the super admin "admin". Everyone else is a resident.
      role: userType.toLowerCase() === 'admin' ? 'admin' : 'resident',
      userId: payload ? payload.user_id : '',
      email: email,
      // `exp` is in seconds, JavaScript works in milliseconds.
      expiresAt: payload ? payload.exp * 1000 : Date.now() + 60 * 60 * 1000,
    };
  }

  /** localStorage survives a page refresh, so the user stays signed in. */
  private saveSession(session: Session): void {
    localStorage.setItem(environment.authStorageKey, JSON.stringify(session));
    this.session = session;
  }

  private readSavedSession(): Session | null {
    const saved = localStorage.getItem(environment.authStorageKey);
    if (!saved) {
      return null;
    }
    try {
      const session: Session = JSON.parse(saved);
      if (!session.token || session.expiresAt <= Date.now()) {
        localStorage.removeItem(environment.authStorageKey);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(environment.authStorageKey);
      return null;
    }
  }
}
