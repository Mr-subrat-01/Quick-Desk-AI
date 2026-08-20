'use client';

import { useState, useEffect, useCallback } from 'react';
import { TicketService } from '@/services/ticket.service';
import { Ticket } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CreateTicketModal } from '@/components/tickets/create-ticket-modal';
import { TicketDetailModal } from '@/components/tickets/ticket-detail-modal';
import { Loader } from '@/components/common/Loader';
import { getStatusBadgeClass, getPriorityBadgeClass } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  Clock,
  CheckCircle2,
  ChevronRight,
  Inbox,
  Filter,
} from 'lucide-react';

export default function EmployeeTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(async (status: string, cursor?: string | null) => {
    try {
      const res = await TicketService.getTickets({
        take: 10,
        status: status || undefined,
        lastSeenId: cursor || undefined,
      });

      if (cursor) {
        setTickets((prev) => [...prev, ...res.tickets]);
      } else {
        setTickets(res.tickets);
      }
      setHasNextPage(res.hasNextPage);
      setNextCursor(res.nextCursor);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch tickets');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchTickets(statusFilter, null);
  }, [statusFilter, fetchTickets]);

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    setNextCursor(null);
  };

  const handleLoadMore = () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    fetchTickets(statusFilter, nextCursor);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white">My Tickets</h1>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Ticket
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
        <Filter className="w-4 h-4 text-slate-400 mr-1" />
        {[
          { label: 'All Tickets', value: '' },
          { label: 'Open', value: 'OPEN' },
          { label: 'Resolved', value: 'RESOLVED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === tab.value
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader />
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <Inbox className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No tickets found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter
              ? `You don't have any tickets matching the '${statusFilter}' status.`
              : "You haven't created any support tickets yet."}
          </p>
          {!statusFilter && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Submit First Ticket
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((ticket) => {
              const isResolved = ticket.status === 'RESOLVED';
              return (
                <Card
                  key={ticket.id}
                  size="sm"
                  onClick={() => setSelectedTicket(ticket)}
                  className="bg-slate-900/50 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow-indigo-500/5 cursor-pointer"
                >
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Badge className={getStatusBadgeClass(ticket.status)}>
                        {isResolved ? (
                          <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1 inline" />
                        )}
                        {ticket.status}
                      </Badge>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ticket.category && (
                          <Badge className="bg-slate-800/80 text-slate-300 border-slate-700/60 text-[10px] py-0.5 px-2">
                            {ticket.category}
                          </Badge>
                        )}

                        {ticket.priority && (
                          <Badge className={`text-[10px] py-0.5 px-2 ${getPriorityBadgeClass(ticket.priority)}`}>
                            {ticket.priority}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardTitle className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {ticket.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="py-2">
                    <CardDescription className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </CardDescription>
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-400 transition-colors font-medium">
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {hasNextPage && (
            <div className="pt-4 text-center">
              <Button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                size="sm"
              >
                {isLoadingMore ? (
                  <>
                    <Loader size="sm" /> Loading...
                  </>
                ) : (
                  'Load More Tickets'
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setNextCursor(null);
          fetchTickets(statusFilter, null);
        }}
      />

      <TicketDetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
