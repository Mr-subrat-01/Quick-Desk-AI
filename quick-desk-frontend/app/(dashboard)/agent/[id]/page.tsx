'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TicketService } from '@/services/ticket.service';
import { Ticket } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader } from '@/components/common/Loader';
import { getPriorityBadgeClass, getStatusBadgeClass } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Bot,
  History,
  User,
} from 'lucide-react';

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params?.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [category, setCategory] = useState<string>('OTHERS');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [reply, setReply] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const REPLY_MAX = 2000;

  const fetchTicket = useCallback(async () => {
    try {
      const data = await TicketService.getTicketById(ticketId);
      setTicket(data);
      setCategory(data.category || data.aiCategory || 'OTHERS');
      setPriority(data.priority || data.aiPriority || 'MEDIUM');
      setReply(data.reply || data.aiDraftReply || '');
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch ticket details');
      router.push('/agent');
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, router]);

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId, fetchTicket]);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!ticket || ticket.status === 'RESOLVED') return;

    if (!reply.trim()) {
      toast.error('Response reply cannot be empty');
      return;
    }

    if (reply.length > REPLY_MAX) {
      toast.error(`Reply must be at most ${REPLY_MAX} characters`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await TicketService.resolveTicket(ticket.id, { category, priority, reply });
      toast.success((res as any)?.message || 'Ticket resolved successfully');
      fetchTicket();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  if (!ticket) return null;

  const isResolved = ticket.status === 'RESOLVED';
  const showWarning = !isResolved && (category !== ticket.aiCategory || priority !== ticket.aiPriority);

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={getStatusBadgeClass(ticket.status)}>
            {ticket.status}
          </Badge>
          {ticket.category && (
            <Badge className="bg-slate-800 text-slate-300 border-slate-700">
              {ticket.category}
            </Badge>
          )}
          {ticket.priority && (
            <Badge className={getPriorityBadgeClass(ticket.priority)}>
              {ticket.priority} Priority
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{ticket.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800/80 shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Request Details
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Raised by {ticket.employee?.firstName} {ticket.employee?.lastName} ({ticket.employee?.email}) on {new Date(ticket.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </div>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    ttachments
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {ticket.attachments.map((fileName, idx) => (
                      <Badge
                        key={idx}
                        className="bg-slate-800/90 text-slate-200 border-slate-700 text-xs py-1 px-2.5 flex items-center gap-1.5"
                      >
                        <span>{fileName}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {(ticket.aiCategory || ticket.aiPriority || ticket.aiDraftReply) && (
            <Card className="bg-gradient-to-r from-indigo-950/20 to-violet-950/10 border-indigo-500/20 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-indigo-400 flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    AI Suggestions
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-lg border border-indigo-500/10">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        AI Suggested Category
                      </span>
                      <span className="font-semibold text-indigo-200 text-xs">
                        {ticket.aiCategory || 'N/A'}
                      </span>
                    </div>
                    {!isResolved && ticket.aiCategory && category !== ticket.aiCategory && (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => setCategory(ticket.aiCategory!)}
                      >
                        Apply AI
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-lg border border-indigo-500/10">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        AI Suggested Priority
                      </span>
                      <span className="font-semibold text-indigo-200 text-xs">
                        {ticket.aiPriority || 'N/A'}
                      </span>
                    </div>
                    {!isResolved && ticket.aiPriority && priority !== ticket.aiPriority && (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => setPriority(ticket.aiPriority!)}
                      >
                        Apply AI
                      </Button>
                    )}
                  </div>
                </div>

                {ticket.aiDraftReply && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                      AI Generated Draft Reply
                    </span>
                    <div className="bg-indigo-950/10 border border-indigo-500/10 rounded-xl p-4 text-xs text-indigo-100 whitespace-pre-wrap leading-relaxed relative">
                      {ticket.aiDraftReply}
                      {!isResolved && reply !== ticket.aiDraftReply && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => setReply(ticket.aiDraftReply || '')}
                          className="absolute bottom-2 right-2 text-indigo-400 hover:text-indigo-300 bg-slate-950/80 hover:bg-slate-950/90"
                        >
                          Use Draft
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {ticket.citations && ticket.citations.length > 0 && (
                  <div className="pt-2 border-t border-indigo-500/10">
                    <span className="text-[11px] text-slate-400 block mb-2 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                      Knowledge Base Citations
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ticket.citations.map((cite: string, idx: number) => (
                        <Badge
                          key={idx}
                          className="bg-indigo-900/40 text-indigo-300 border-indigo-500/30 text-[10px]"
                        >
                          {cite}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {ticket.auditLogs && ticket.auditLogs.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800/80 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  Override Audit Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative border-l border-slate-800 ml-3 pl-5 space-y-5 py-2">
                  {ticket.auditLogs.map((log) => (
                    <div key={log.id} className="relative group text-xs">
                      <span className="absolute -left-[26px] top-1 bg-slate-950 border border-slate-700 w-2.5 h-2.5 rounded-full" />

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-300">
                          Changed by {log.agent ? `${log.agent.firstName} ${log.agent.lastName || ''}` : 'Agent'}
                        </span>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>

                      <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase font-bold text-indigo-400">
                            {log.field}
                          </span>
                          <span className="text-slate-500">changed from</span>
                          <span className="text-slate-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {log.oldValue || 'None'}
                          </span>
                          <span className="text-slate-500">to</span>
                          <span className="text-emerald-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {log.newValue || 'None'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800/80 shadow-md h-fit">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                {isResolved ? 'Resolution Summary' : 'Resolution Action'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isResolved ? (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">
                      Final Reply
                    </span>
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 text-emerald-100 whitespace-pre-wrap leading-relaxed">
                      {ticket.reply}
                    </div>
                  </div>

                  {ticket.agent && (
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3 text-slate-400">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] block text-slate-500">RESOLVED BY</span>
                        <span className="font-semibold text-slate-200">
                          {ticket.agent.firstName} {ticket.agent.lastName || ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-300">Category</Label>
                    <Select value={category} onValueChange={(val) => val && setCategory(val)} disabled={isSubmitting}>
                      <SelectTrigger className="w-full bg-slate-950/60 border-slate-800 text-slate-200 text-xs">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="FINANCE">Finance</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="OTHERS">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-300">Priority</Label>
                    <Select value={priority} onValueChange={(val) => val && setPriority(val)} disabled={isSubmitting}>
                      <SelectTrigger className="w-full bg-slate-950/60 border-slate-800 text-slate-200 text-xs">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-300">Response Message</Label>
                      <span className={`text-[10px] ${reply.length > REPLY_MAX ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                        {reply.length}/{REPLY_MAX}
                      </span>
                    </div>
                    <Textarea
                      rows={6}
                      value={reply}
                      maxLength={REPLY_MAX}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your official resolution response to the employee..."
                      className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 resize-none text-xs leading-relaxed"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="success"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader size="sm" /> Resolving...
                      </>
                    ) : (
                      'Send Reply'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
