import { ApiDate } from './api.models';

/** Roles the UI knows about. The API's `user_type` is mapped onto these. */
export type AppRole = 'admin' | 'resident';

export interface Session {
  token: string;
  /** Raw `user_type` as returned by the API (`admin`, `user`, `owner`, `tenant`). */
  userType: string;
  role: AppRole;
  userId: string;
  email: string;
  /** JWT expiry, epoch milliseconds. */
  expiresAt: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  user_type: string;
}

export type ResidentType = 'owner' | 'tenant';

export interface CreateResidentRequest {
  name: string;
  last_name: string;
  email: string;
  mobile: number;
  password: string;
  property_no: string;
  user_type: ResidentType;
}

export interface Resident {
  _id: string;
  name: string;
  last_name?: string;
  email: string;
  mobile?: number | string;
  property_no?: string;
  user_type?: string;
  created_time?: ApiDate;
  /** Held by the client because the API's list endpoint does not return it. */
  __local?: boolean;
}

export type AnnouncementCategory = 'announcement' | 'event' | 'updates';

export interface Announcement {
  _id: string;
  category: AnnouncementCategory | string;
  title: string;
  summary: string;
  event_date?: ApiDate;
  created_time?: ApiDate;
  images?: string[];
  pinned?: boolean;
}

export interface DocumentRecord {
  _id: string;
  document_title: string;
  document_category: string;
  document_file?: string[];
  expiry_date?: ApiDate;
  remarks?: string;
  created_time?: ApiDate;
  /** Held by the client because the API's list endpoint does not return it. */
  __local?: boolean;
}
