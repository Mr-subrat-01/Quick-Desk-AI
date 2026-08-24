'use client';

import { useState, useEffect, useCallback } from 'react';
import { TicketService } from '@/services/ticket.service';
import { Ticket } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Loader } from '@/components/common/Loader';
import { getPriorityBadgeClass, getStatusBadgeClass } from '@/lib/utils';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { socket } from '@/lib/socket';
import {
  Search,
  Bot,
  User,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AgentDashboardPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTickets = useCallback(
    async (
      status: string,
      category: string,
      priority: string,
      search: string,
      pageNum: number = 1,
    ) => {
      try {
        const res = await TicketService.getTickets({
          limit: 15,
          status: status || undefined,
          category: category || undefined,
          priority: priority || undefined,
          search: search || undefined,
          page: pageNum,
        });

        setTickets(res.tickets);
        setTotalTickets(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
        setHasNextPage(res.hasNextPage);
        setHasPreviousPage(res.hasPreviousPage);
      } catch (err: any) {
        toast.error(err.message || 'Failed to fetch tickets');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    setIsLoading(true);
    fetchTickets(statusFilter, categoryFilter, priorityFilter, debouncedSearch, 1);
  }, [statusFilter, categoryFilter, priorityFilter, debouncedSearch, fetchTickets]);

  useEffect(() => {
    const handleTicketRaised = (data: { ticketId: string; title: string }) => {
      toast.info('New Ticket Raised', {
        description: <span>Ticket <b className="font-semibold text-slate-100">{data.title}</b> was raised.</span>,
      });

      if (page !== 1) return;
      if (categoryFilter || priorityFilter) return;

      const matchesFilters = !statusFilter || statusFilter === 'OPEN';
      if (!matchesFilters) return;

      fetchTickets(statusFilter, categoryFilter, priorityFilter, debouncedSearch, 1);
    };

    const handleTicketResolved = (data: { ticketId: string; title: string; category: string; priority: string }) => {
      const matchesFilters =
        (!statusFilter || 'RESOLVED' === statusFilter) &&
        (!categoryFilter || data.category === categoryFilter) &&
        (!priorityFilter || data.priority === priorityFilter);

      setTickets((prevTickets) => {
        const ticketToUpdate = prevTickets.find((t) => t.id === data.ticketId);
        if (!ticketToUpdate) return prevTickets;

        if (matchesFilters) {
          return prevTickets.map((t) =>
            t.id === data.ticketId
              ? {
                  ...t,
                  status: 'RESOLVED' as any,
                  category: data.category as any,
                  priority: data.priority as any,
                }
              : t
          );
        } else {
          setTotalTickets((prevTotal) => Math.max(0, prevTotal - 1));
          return prevTickets.filter((t) => t.id !== data.ticketId);
        }
      });
    };

    socket.on('ticket:raised', handleTicketRaised);
    socket.on('ticket:resolved', handleTicketResolved);

    return () => {
      socket.off('ticket:raised', handleTicketRaised);
      socket.off('ticket:resolved', handleTicketResolved);
    };
  }, [statusFilter, categoryFilter, priorityFilter, debouncedSearch, fetchTickets, page]);

  const handleResetFilters = () => {
    setStatusFilter('');
    setCategoryFilter('');
    setPriorityFilter('');
    setSearchQuery('');
    setPage(1);
  };

  const handlePageChange = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages || isLoading) return;
    setIsLoading(true);
    fetchTickets(statusFilter, categoryFilter, priorityFilter, debouncedSearch, pageNum);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white">Agent Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Total tickets: {totalTickets}</p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="relative w-full sm:w-64 space-y-1">
            <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-0.5">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by ticket title..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 pl-9 text-slate-200 placeholder:text-slate-500 text-xs h-9"
              />
            </div>
          </div>

          <div className="w-full sm:w-36 space-y-1">
            <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-0.5">Status</Label>
            <Select value={statusFilter || 'ALL'} onValueChange={(val) => {
              setStatusFilter(!val || val === 'ALL' ? '' : val);
              setPage(1);
            }}>
              <SelectTrigger className="w-full bg-slate-950/60 border-slate-800 text-slate-300 text-xs h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-300 text-xs">
                <SelectGroup>
                  <SelectLabel className="text-slate-500 text-[10px] uppercase tracking-wider">Status</SelectLabel>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-36 space-y-1">
            <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-0.5">Category</Label>
            <Select value={categoryFilter || 'ALL'} onValueChange={(val) => {
              setCategoryFilter(!val || val === 'ALL' ? '' : val);
              setPage(1);
            }}>
              <SelectTrigger className="w-full bg-slate-950/60 border-slate-800 text-slate-300 text-xs h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-300 text-xs">
                <SelectGroup>
                  <SelectLabel className="text-slate-500 text-[10px] uppercase tracking-wider">Category</SelectLabel>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="OTHERS">Others</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-36 space-y-1">
            <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-0.5">Priority</Label>
            <Select value={priorityFilter || 'ALL'} onValueChange={(val) => {
              setPriorityFilter(!val || val === 'ALL' ? '' : val);
              setPage(1);
            }}>
              <SelectTrigger className="w-full bg-slate-950/60 border-slate-800 text-slate-300 text-xs h-9">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-300 text-xs">
                <SelectGroup>
                  <SelectLabel className="text-slate-500 text-[10px] uppercase tracking-wider">Priority</SelectLabel>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {(statusFilter || categoryFilter || priorityFilter || searchQuery) && (
            <Button
              onClick={handleResetFilters}
              variant="ghost"
              size="sm"
              className="shrink-0 ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader />
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <h3 className="text-base font-semibold text-slate-300">No tickets found</h3>
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
                  className="bg-slate-900/50 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow-indigo-500/5"
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

                    {ticket.aiDraftReply && (
                      <Badge className="w-fit bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-[10px] py-0.5 px-2">
                        <Bot className="w-3 h-3 mr-1 inline text-indigo-400" /> AI Draft Ready
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="py-2">
                    <CardDescription className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </CardDescription>
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                      {ticket.employee && (
                        <div className="flex items-center gap-1 text-slate-400 font-medium truncate">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {ticket.employee.firstName} {ticket.employee.lastName}
                          </span>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {new Date(ticket.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant={isResolved ? 'secondary' : 'default'}
                      onClick={() => router.push(`/agent/${ticket.id}`)}
                    >
                      {isResolved ? 'View' : 'Resolve'}
                    </Button>
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
    </div>
  );
}
