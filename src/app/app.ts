import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastContainer } from './shared/components/toast-container/toast-container';

/**
 * The root component. main.ts starts the app with this one, and index.html
 * holds its tag: <app-root></app-root>.
 *
 * It only does two things: show the current page (<router-outlet />) and keep
 * the pop-up messages on screen.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
