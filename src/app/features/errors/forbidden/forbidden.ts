import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { Icon } from '../../../shared/components/icon/icon';

/** Shown when a signed-in user opens a page their role is not allowed to see. */
@Component({
  selector: 'app-forbidden',
  imports: [RouterLink, Icon],
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.css',
})
export class Forbidden {
  private auth = inject(AuthService);

  home(): string {
    return this.auth.homeRoute();
  }

  roleLabel(): string {
    return this.auth.isAdmin() ? 'Super Admin' : 'Resident';
  }
}
