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
import { socket } from '@/lib/socket';
import {
  Plus,
  ChevronRight,
  Filter,
  ChevronLeft,
} from 'lucide-react';

export default function EmployeeDashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(async (status: string, pageNum: number = 1) => {
    try {
      const res = await TicketService.getTickets({
        limit: 15,
        status: status || undefined,
        page: pageNum,
      });

      setTickets(res.tickets);
      setTotalTickets(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
      setHasNextPage(res.hasNextPage);
      setHasPreviousPage(res.hasPreviousPage);
    } catch (err: any) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchTickets(statusFilter, 1);
  }, [statusFilter, fetchTickets]);

  useEffect(() => {
    const handleTicketResolved = (data: { ticketId: string; title: string }) => {
      toast.success('Ticket Resolved', {
        description: <span>Your ticket <b className="font-semibold text-slate-100">{data.title}</b> has been resolved.</span>,
      });

      const matchesFilters = !statusFilter || statusFilter === 'RESOLVED';

      setTickets((prevTickets) => {
        const ticketToUpdate = prevTickets.find((t) => t.id === data.ticketId);
        if (!ticketToUpdate) return prevTickets;

        if (matchesFilters) {
          return prevTickets.map((t) =>
            t.id === data.ticketId
              ? {
                  ...t,
                  status: 'RESOLVED',
                }
              : t
          );
        } else {
          setTotalTickets((prevTotal) => Math.max(0, prevTotal - 1));
          return prevTickets.filter((t) => t.id !== data.ticketId);
        }
      });
    };

    socket.on('ticket:resolved', handleTicketResolved);

    return () => {
      socket.off('ticket:resolved', handleTicketResolved);
    };
  }, [statusFilter, fetchTickets, page]);

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handlePageChange = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages || isLoading) return;
    setIsLoading(true);
    fetchTickets(statusFilter, pageNum);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white">My Tickets</h1>
          <p className="text-xs text-slate-400 mt-1">Total tickets: {totalTickets}</p>
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
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Raise First Ticket
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 flex-wrap gap-4">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                Showing page <span className="font-semibold text-slate-200">{page}</span> of{' '}
                <span className="font-semibold text-slate-200">{totalPages}</span> ({totalTickets} tickets total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!hasPreviousPage}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!hasNextPage}
                  variant="outline"
                  size="sm"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setPage(1);
          fetchTickets(statusFilter, 1);
        }}
      />

      <TicketDetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
