import { Injectable } from '@angular/core';

/**
 * Counts how many requests are running, so the shell can show the thin blue
 * bar at the top of the screen. The loading interceptor calls start()/stop().
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pending = 0;

  isLoading(): boolean {
    return this.pending > 0;
  }

  start(): void {
    this.pending = this.pending + 1;
  }

  stop(): void {
    this.pending = this.pending - 1;
    if (this.pending < 0) {
      this.pending = 0;
    }
  }
}
