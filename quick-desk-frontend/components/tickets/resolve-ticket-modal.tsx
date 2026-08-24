'use client';

import { useState, useEffect } from 'react';
import { TicketService } from '@/services/ticket.service';
import { Ticket } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Loader } from '@/components/common/Loader';
import { toast } from 'sonner';
import { Bot, BookOpen, AlertTriangle, Paperclip, FileText } from 'lucide-react';

interface ResolveTicketModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResolveTicketModal({ ticket, onClose, onSuccess }: ResolveTicketModalProps) {
  const [category, setCategory] = useState<string>('OTHERS');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [reply, setReply] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const REPLY_MAX = 2000;

  useEffect(() => {
    if (ticket) {
      setCategory(ticket.category || ticket.aiCategory || 'OTHERS');
      setPriority(ticket.priority || ticket.aiPriority || 'MEDIUM');
      setReply(ticket.reply || ticket.aiDraftReply || '');
    }
  }, [ticket]);

  const isOpen = !!ticket;
  if (!ticket) return null;

  const isResolved = ticket.status === 'RESOLVED';

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (isResolved) return;
    if (!reply.trim()) {
      toast.error('Response reply cannot be empty');
      return;
    }

    if (reply.length > REPLY_MAX) {
      toast.error(`Reply must be at most ${REPLY_MAX} characters`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await TicketService.resolveTicket(ticket.id, { category, priority, reply });
      toast.success((res as any)?.message);
      onSuccess();
      onClose();
    } catch (err: any) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent side="right" className="max-w-2xl w-full p-0 flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl">
        <SheetHeader className="relative text-left p-6 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-400 font-mono font-medium">#{ticket.id.slice(0, 8)}</span>
              <Badge className={ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}>
                {ticket.status}
              </Badge>
            </div>
            <SheetTitle className="text-lg font-bold text-white leading-snug">{ticket.title}</SheetTitle>
            <SheetDescription className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
              <span>Employee: <span className="text-slate-200 font-medium">{ticket.employee?.firstName} {ticket.employee?.lastName}</span> ({ticket.employee?.email})</span>
              <span>|</span>
              <span>Submitted: <span className="text-slate-300 font-medium">{new Date(ticket.createdAt).toLocaleString()}</span></span>
            </SheetDescription>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee Description</Label>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </div>
            </div>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-400" /> Attachments ({ticket.attachments.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {ticket.attachments.map((fileName, idx) => (
                    <Badge key={idx} className="bg-slate-800/90 text-slate-200 border-slate-700 text-xs py-1 px-2.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{fileName}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(ticket.aiCategory || ticket.aiPriority || ticket.aiDraftReply) && (
              <div className="bg-gradient-to-r from-indigo-950/40 to-violet-950/30 border border-indigo-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <span>AI Grounded Analysis & Suggestions</span>
                  </div>
                  <span className="text-[10px] text-indigo-300/60">Auto-Generated</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg border border-indigo-500/10">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">AI Suggested Category</span>
                      <span className="font-semibold text-indigo-200 text-xs">{ticket.aiCategory || 'N/A'}</span>
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

                  <div className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg border border-indigo-500/10">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">AI Suggested Priority</span>
                      <span className="font-semibold text-indigo-200 text-xs">{ticket.aiPriority || 'N/A'}</span>
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

                {ticket.citations && ticket.citations.length > 0 && (
                  <div className="pt-2 border-t border-indigo-500/10">
                    <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-indigo-400" /> Knowledge Base Citations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ticket.citations.map((cite: string, idx: number) => (
                        <Badge key={idx} className="bg-indigo-900/40 text-indigo-300 border-indigo-500/30 text-[10px]">
                          {cite}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Category</Label>
                <Select value={category} onValueChange={(val) => val && setCategory(val)} disabled={isLoading || isResolved}>
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
                <Select value={priority} onValueChange={(val) => val && setPriority(val)} disabled={isLoading || isResolved}>
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
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-300">Resolution Reply / Response</Label>
                <div className="flex items-center gap-3">
                  {!isResolved && ticket.aiDraftReply && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setReply(ticket.aiDraftReply || '')}
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      <Bot className="w-3 h-3 mr-1" /> Reset to AI Draft
                    </Button>
                  )}
                  <span className={`text-[10px] ${reply.length > REPLY_MAX ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                    {reply.length}/{REPLY_MAX}
                  </span>
                </div>
              </div>
              <Textarea
                rows={4}
                value={reply}
                maxLength={REPLY_MAX}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your official resolution response to the employee..."
                className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 resize-none text-xs leading-relaxed"
                disabled={isLoading || isResolved}
                required
              />
            </div>

            {!isResolved && (category !== ticket.aiCategory || priority !== ticket.aiPriority) && (
              <div className="flex items-center gap-2 text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>You are overriding AI predictions. This action will be recorded in the audit log.</span>
              </div>
            )}
          </div>

          <SheetFooter className="flex-row justify-end gap-3 p-6 border-t border-slate-800/80 bg-slate-900/90">
            {isResolved ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader size="sm" /> Resolving...
                    </>
                  ) : (
                    'Send Reply'
                  )}
                </Button>
              </>
            )}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
