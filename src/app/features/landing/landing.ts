import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon, IconName } from '../../shared/components/icon/icon';

/** One card in the "Everything the community needs" grid. */
interface Feature {
  icon: IconName;
  title: string;
  text: string;
}

/**
 * The public home page at "/", shown to visitors who are not signed in.
 *
 * Nothing here talks to the API — the "dashboard" in the picture is drawn with
 * plain HTML and CSS. The 3D effect comes from two CSS ideas: `perspective` on
 * the stage, and `transform: rotateX/rotateY` on the deck of cards inside it,
 * which we update as the mouse moves.
 */
@Component({
  selector: 'app-landing',
  imports: [RouterLink, Icon],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  /** The resting tilt of the picture, in degrees. */
  rotateX = 6;
  rotateY = -14;

  features: Feature[] = [
    {
      icon: 'users',
      title: 'Resident directory',
      text: 'Owners and tenants with property numbers, instant search and pagination.',
    },
    {
      icon: 'megaphone',
      title: 'Feed announcements',
      text: 'A social-style feed with categories, images and one-tap pinning.',
    },
    {
      icon: 'folder',
      title: 'Document vault',
      text: 'Upload agreements and contracts, then track every expiry date.',
    },
    {
      icon: 'bell',
      title: 'Expiry alerts',
      text: 'Documents expiring today surface automatically on the notification screen.',
    },
    {
      icon: 'shield',
      title: 'Role-aware access',
      text: 'Guards, an auth interceptor and a sidebar generated from the signed-in role.',
    },
    {
      icon: 'dashboard',
      title: 'Live dashboards',
      text: 'Separate Super Admin and Resident dashboards with real counts.',
    },
  ];

  /** The value the template puts into [style.transform]. */
  get transform(): string {
    return 'rotateX(' + this.rotateX + 'deg) rotateY(' + this.rotateY + 'deg)';
  }

  /** Leans the picture towards the mouse pointer. */
  onMouseMove(event: MouseEvent): void {
    const stage = event.currentTarget as HTMLElement;
    const box = stage.getBoundingClientRect();

    // Where the pointer is inside the box, from -0.5 (left/top) to 0.5.
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;

    this.rotateX = Math.round(y * -14);
    this.rotateY = Math.round(x * 22);
  }

  /** Back to the resting tilt when the mouse leaves. */
  onMouseLeave(): void {
    this.rotateX = 6;
    this.rotateY = -14;
  }
}
