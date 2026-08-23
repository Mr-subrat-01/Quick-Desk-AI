'use client';

import { Ticket } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPriorityBadgeClass, getStatusBadgeClass } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { AlertCircle } from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  onClose: () => void;
}

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  const isOpen = !!ticket;
  if (!ticket) return null;


  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent side="right" className="max-w-xl w-full p-0 flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl">
        <SheetHeader className="relative text-left p-6 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
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
            <SheetTitle className="text-lg font-bold text-white leading-snug">
              {ticket.title} 
              <br />
              <span className="text-[10px] text-slate-400">Created: {new Date(ticket.createdAt).toLocaleString()}</span>
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</h3>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </div>
          </div>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                Attachments
              </h3>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((fileName, idx) => (
                  <Badge key={idx} className="bg-slate-800/90 text-slate-200 border-slate-700 text-xs py-1 px-2.5 flex items-center gap-1.5">
                    <span>{fileName}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {ticket.reply ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  Resolution Response
                </h3>
                {ticket.agent && (
                  <span className="text-xs text-slate-400">
                    Responded by: <span className="text-slate-200 font-medium">{ticket.agent.firstName}</span>
                  </span>
                )}
              </div>
              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed">
                {ticket.reply}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3 text-slate-400 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Support agent is reviewing your request</span>
            </div>
          )}
        </div>

        <SheetFooter className="flex-row justify-end p-6 border-t border-slate-800/80 bg-slate-900/90">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
