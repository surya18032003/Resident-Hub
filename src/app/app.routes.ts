import { Routes } from '@angular/router';

import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guards';

/**
 * Everything below the shell is lazy-loaded, guarded by `authGuard`, and then
 * narrowed per role by `roleGuard` reading `data.roles`.
 */
export const routes: Routes = [
  {
    // Public landing page. `guestGuard` sends signed-in users to their dashboard.
    path: '',
    pathMatch: 'full',
    canActivate: [guestGuard],
    title: 'ResHub · Community Management',
    loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in · ResHub',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      // ------------------------------------------------------------ admin
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            title: 'Dashboard · ResHub',
            loadComponent: () =>
              import('./features/admin/dashboard/admin-dashboard').then((m) => m.AdminDashboard),
          },
          {
            path: 'residents',
            title: 'Residents · ResHub',
            loadComponent: () =>
              import('./features/admin/residents/resident-list/resident-list').then(
                (m) => m.ResidentList,
              ),
          },
          {
            path: 'residents/create',
            title: 'Create Resident · ResHub',
            loadComponent: () =>
              import('./features/admin/residents/create-resident/create-resident').then(
                (m) => m.CreateResident,
              ),
          },
          {
            path: 'announcements',
            title: 'Announcements · ResHub',
            loadComponent: () =>
              import('./features/admin/announcements/announcement-list/announcement-list').then(
                (m) => m.AnnouncementList,
              ),
          },
          {
            path: 'announcements/create',
            title: 'Create Announcement · ResHub',
            loadComponent: () =>
              import('./features/admin/announcements/create-announcement/create-announcement').then(
                (m) => m.CreateAnnouncement,
              ),
          },
          {
            path: 'documents',
            title: 'Documents · ResHub',
            loadComponent: () =>
              import('./features/admin/documents/document-list/document-list').then(
                (m) => m.DocumentList,
              ),
          },
          {
            path: 'documents/create',
            title: 'Create Document · ResHub',
            loadComponent: () =>
              import('./features/admin/documents/create-document/create-document').then(
                (m) => m.CreateDocument,
              ),
          },
          {
            path: 'notifications',
            title: 'Notifications · ResHub',
            loadComponent: () =>
              import('./features/admin/notifications/notifications').then((m) => m.Notifications),
          },
        ],
      },

      // --------------------------------------------------------- resident
      {
        path: 'resident',
        canActivate: [roleGuard],
        data: { roles: ['resident'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            title: 'Dashboard · ResHub',
            loadComponent: () =>
              import('./features/resident/dashboard/resident-dashboard').then(
                (m) => m.ResidentDashboard,
              ),
          },
          { path: 'announcements', pathMatch: 'full', redirectTo: 'announcements/all' },
          {
            path: 'announcements/:filter',
            title: 'Announcements · ResHub',
            loadComponent: () =>
              import('./features/resident/announcements/announcement-feed/announcement-feed').then(
                (m) => m.AnnouncementFeed,
              ),
          },
        ],
      },

      {
        path: 'forbidden',
        title: 'Access denied · ResHub',
        loadComponent: () =>
          import('./features/errors/forbidden/forbidden').then((m) => m.Forbidden),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/errors/not-found/not-found').then((m) => m.NotFound),
  },
];
