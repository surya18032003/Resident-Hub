import { Component, Input } from '@angular/core';

/**
 * The title block at the top of every page.
 *
 *   <app-page-header title="Residents" subtitle="...">
 *     <button>Refresh</button>     <- goes into the <ng-content /> slot
 *   </app-page-header>
 */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class PageHeader {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
}
