export interface TicketUser {
  id?: string;
  firstName: string;
  lastName?: string;
  email?: string;
}

export interface AuditLog {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  agent?: TicketUser;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'RESOLVED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  category?: 'IT' | 'HR' | 'FINANCE' | 'ADMIN' | 'OTHERS' | null;
  aiPriority?: string | null;
  aiCategory?: string | null;
  aiDraftReply?: string | null;
  citations?: string[];
  reply?: string | null;
  attachments?: string[];
  employeeId?: string;
  agentId?: string | null;
  createdAt: string;
  updatedAt: string;
  agent?: TicketUser | null;
  employee?: TicketUser | null;
  auditLogs?: AuditLog[];
}

export interface GetTicketsQueryParams {
  take?: number;
  lastSeenId?: string;
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
  orderBy?: 'asc' | 'desc';
}

export interface GetTicketsResponse {
  tickets: Ticket[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  attachments?: string[];
}

export interface ResolveTicketPayload {
  category: string;
  priority: string;
  reply: string;
}
