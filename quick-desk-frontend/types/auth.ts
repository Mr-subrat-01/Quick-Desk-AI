export interface LoginPayload {
  email: string;
  password: string;
}

export interface SessionItem {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  updatedAt?: string;
  isCurrent?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'AGENT' | 'EMPLOYEE';
}

export interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
}
