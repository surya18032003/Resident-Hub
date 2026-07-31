import { DatePipe } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

/**
 * The app's settings. main.ts hands this to Angular at start-up, and it is
 * where every app-wide feature is switched on.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Zone.js watches clicks, timers and HTTP replies, and repaints the screen
    // after each one. It is why a plain `this.loading = false` is enough.
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Logs uncaught errors to the console instead of losing them.
    provideBrowserGlobalErrorListeners(),

    // The router: reads app.routes.ts and swaps pages in <router-outlet />.
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),

    // HttpClient, plus the three functions every request passes through.
    // They run in this order on the way out.
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor, errorInterceptor])),

    // Used by our own date pipe, in shared/pipes/api-date.pipe.ts.
    DatePipe,
  ],
};
