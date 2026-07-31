/**
 * Application environment configuration.
 *
 * `apiBaseUrl` is the only value that normally changes between environments,
 * so it is kept in a single place and injected through the service layer.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'https://fourdotz-backend-1.onrender.com/api/v1/test',
  /** Key used to persist the auth session in localStorage. */
  authStorageKey: 'res-hub.session',
};
