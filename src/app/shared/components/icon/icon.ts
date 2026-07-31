import { Component, Input } from '@angular/core';

/** The names you can pass to <app-icon name="...">. */
export type IconName =
  | 'dashboard'
  | 'users'
  | 'user'
  | 'megaphone'
  | 'folder'
  | 'bell'
  | 'logout'
  | 'search'
  | 'pin'
  | 'calendar'
  | 'clock'
  | 'image'
  | 'upload'
  | 'file'
  | 'check'
  | 'alert'
  | 'info'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'menu'
  | 'close'
  | 'plus'
  | 'download'
  | 'mail'
  | 'phone'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'building'
  | 'inbox'
  | 'shield';

/**
 * All the icons in one place, drawn as SVG.
 *
 * Used like this:  <app-icon name="bell" [size]="18" />
 *
 * `@Input()` marks a value the parent can pass in. The template picks the
 * matching drawing with a @switch on `name`.
 */
@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.css',
})
export class Icon {
  @Input({ required: true }) name!: IconName;
  @Input() size = 20;

  /** Only used by 'pin', which has a solid version for "already pinned". */
  @Input() filled = false;
}
