import { AppRole } from '../models/domain.models';
import { IconName } from '../../shared/components/icon/icon';

export interface NavItem {
  label: string;
  icon: IconName;
  route?: string;
  /** Renders a collapsible group instead of a leaf link. */
  children?: Array<{ label: string; route: string }>;
  /** Shows the live notification count next to the label. */
  badge?: 'notifications';
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
  {
    label: 'Residents',
    icon: 'users',
    children: [
      { label: 'Create Resident', route: '/admin/residents/create' },
      { label: 'Resident List', route: '/admin/residents' },
    ],
  },
  {
    label: 'Announcements',
    icon: 'megaphone',
    children: [
      { label: 'Create Announcement', route: '/admin/announcements/create' },
      { label: 'Announcement List', route: '/admin/announcements' },
    ],
  },
  {
    label: 'Documents',
    icon: 'folder',
    children: [
      { label: 'Create Document', route: '/admin/documents/create' },
      { label: 'Document List', route: '/admin/documents' },
    ],
  },
  { label: 'Notifications', icon: 'bell', route: '/admin/notifications', badge: 'notifications' },
];

const RESIDENT_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/resident/dashboard' },
  {
    label: 'Announcements',
    icon: 'megaphone',
    children: [
      { label: 'All Announcements', route: '/resident/announcements/all' },
      { label: 'Pinned Announcements', route: '/resident/announcements/pinned' },
    ],
  },
];

/** The sidebar is built from this — nothing role-specific lives in the template. */
export function navigationFor(role: AppRole | null): NavItem[] {
  if (role === 'admin') {
    return ADMIN_NAV;
  }
  if (role === 'resident') {
    return RESIDENT_NAV;
  }
  return [];
}
