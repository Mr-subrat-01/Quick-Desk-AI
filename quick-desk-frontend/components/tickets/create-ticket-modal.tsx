'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { TicketService } from '@/services/ticket.service';
import { Loader } from '@/components/common/Loader';
import { toast } from 'sonner';
import { Plus, X, Paperclip, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const TITLE_MAX = 100;
  const DESC_MAX = 1000;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFileNames = Array.from(files).map((f) => f.name);
    const combined = Array.from(new Set([...attachments, ...newFileNames]));

    if (combined.length > 3) {
      toast.error('You can only attach up to 3 files per ticket');
      setAttachments(combined.slice(0, 3));
    } else {
      setAttachments(combined);
    }
  };

  const removeAttachment = (fileName: string) => {
    setAttachments((prev) => prev.filter((name) => name !== fileName));
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Please enter both title and description');
      return;
    }

    if (title.length > TITLE_MAX) {
      toast.error(`Title must be at most ${TITLE_MAX} characters`);
      return;
    }

    if (description.length > DESC_MAX) {
      toast.error(`Description must be at most ${DESC_MAX} characters`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await TicketService.createTicket({ title, description, attachments });
      toast.success(res?.message || 'Ticket created successfully!');
      setTitle('');
      setDescription('');
      setAttachments([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create ticket');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent side="right" className="max-w-xl w-full p-0 flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl">
        <SheetHeader className="relative text-left p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold text-white">Rise New Ticket</SheetTitle>
              <SheetDescription className="text-xs text-slate-400">
                Rise an ticket for our support team to resolve.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="title" className="text-xs font-semibold text-slate-300">Title</Label>
                <span className={`text-[10px] ${title.length > TITLE_MAX ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                  {title.length}/{TITLE_MAX}
                </span>
              </div>
              <Input
                id="title"
                placeholder="e.g. Cannot connect to corporate VPN"
                value={title}
                maxLength={TITLE_MAX}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 text-xs"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-xs font-semibold text-slate-300">Description</Label>
                <span className={`text-[10px] ${description.length > DESC_MAX ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                  {description.length}/{DESC_MAX}
                </span>
              </div>
              <Textarea
                id="description"
                placeholder="Please provide steps to reproduce or details about the issue..."
                rows={5}
                value={description}
                maxLength={DESC_MAX}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 resize-none text-xs"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Attachments (Max 3 files)</span>
                <span className="text-[10px] text-slate-500">{attachments.length}/3 selected</span>
              </Label>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors">
                  <Paperclip className="w-3.5 h-3.5" /> Select Files
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isLoading || attachments.length >= 3}
                  />
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {attachments.map((fileName) => (
                    <Badge
                      key={fileName}
                      className="bg-slate-800/90 text-slate-200 border-slate-700 text-xs py-1 px-2.5 flex items-center gap-1.5"
                    >
                      <FileText className="w-3 h-3 text-indigo-400" />
                      <span className="max-w-[150px] truncate">{fileName}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(fileName)}
                        className="text-slate-400 hover:text-rose-400 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-3 p-6 border-t border-slate-800/80 bg-slate-900/90">
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
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size="sm" /> Submitting...
                </>
              ) : (
                'Rise Ticket'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
