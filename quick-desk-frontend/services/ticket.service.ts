import { fetchApi } from '../lib/api';
import {
  CreateTicketPayload,
  GetTicketsQueryParams,
  GetTicketsResponse,
  ResolveTicketPayload,
  Ticket,
} from '@/types';

export const TicketService = {
  async createTicket(payload: CreateTicketPayload) {
    const res = await fetchApi('/ticket', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  },

  async getTickets(params: GetTicketsQueryParams = {}): Promise<GetTicketsResponse> {
    const query = new URLSearchParams();
    if (params.take) query.set('take', params.take.toString());
    if (params.lastSeenId) query.set('lastSeenId', params.lastSeenId);
    if (params.status) query.set('status', params.status);
    if (params.category) query.set('category', params.category);
    if (params.priority) query.set('priority', params.priority);
    if (params.search) query.set('search', params.search);
    if (params.orderBy) query.set('orderBy', params.orderBy);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchApi(`/ticket${queryString}`);
    return res.data || res;
  },

  async getTicketById(id: string): Promise<Ticket> {
    const res = await fetchApi(`/ticket/${id}`);
    return res.data || res;
  },

  async resolveTicket(id: string, payload: ResolveTicketPayload): Promise<Ticket> {
    const res = await fetchApi(`/ticket/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data || res;
  },
};
