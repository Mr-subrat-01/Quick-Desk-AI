'use client';

import { TicketService } from "@/services/ticket.service";
import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Loader } from "@/components/common/Loader";

interface MetricsData {
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  medianResolutionTime: string;
  aiOverrideCategoryPercentage: string;
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchMetrics = useCallback(async (showSilent = false) => {
    if (!showSilent) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const res = await TicketService.getTicketMetrics();
      setMetrics(res.data || res);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch metrics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white">Metrics Dashboard</h1>
        </div>
        <Button
          onClick={() => fetchMetrics(true)}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="border-slate-800 hover:bg-slate-800/60 text-slate-300 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card size="sm" className="bg-slate-900/50 border-slate-800/80 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Open Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-100">
              {metrics?.byStatus.OPEN || 0}
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="bg-slate-900/50 border-slate-800/80 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Resolved Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-100">
              {metrics?.byStatus.RESOLVED || 0}
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="bg-slate-900/50 border-slate-800/80 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              AI Category Override Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-100">
              {metrics?.aiOverrideCategoryPercentage || "0%"}
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="bg-slate-900/50 border-slate-800/80 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Median Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-100">
              {metrics?.medianResolutionTime || "0h 0m"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card size="sm" className="bg-slate-900/50 border-slate-800/80 shadow-md">
        <CardHeader className="pb-3 border-b border-slate-800/60">
          <CardTitle className="text-sm font-bold text-white">Tickets By Category</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-850">
                <TableHead className="text-slate-400 font-semibold">Category</TableHead>
                <TableHead className="text-right text-slate-400 font-semibold w-24">Ticket Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics?.byCategory && Object.keys(metrics.byCategory).length > 0 ? (
                Object.entries(metrics.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => (
                    <TableRow key={category} className="border-slate-850 hover:bg-slate-900/20">
                      <TableCell className="font-medium text-slate-300 uppercase tracking-wider text-[10px]">
                        {category}
                      </TableCell>
                      <TableCell className="text-right text-slate-200 font-semibold">
                        {count}
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-6 text-slate-500 text-xs">
                    No categories found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}