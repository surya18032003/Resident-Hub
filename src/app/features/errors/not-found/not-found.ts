import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { Icon } from '../../../shared/components/icon/icon';

/** Shown for any address that does not match a route (see app.routes.ts). */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Icon],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFound {
  private auth = inject(AuthService);

  /** Signed-in users go to their dashboard, visitors to the landing page. */
  home(): string {
    return this.auth.isLoggedIn() ? this.auth.homeRoute() : '/';
  }
}
