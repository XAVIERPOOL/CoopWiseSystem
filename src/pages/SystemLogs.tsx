import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardCheck,
  User,
  FileText,
  Settings,
  Activity,
  Search,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Log {
  id: number;
  user_name: string;
  action: string;
  module: string;
  description: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 15;

const SystemLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('ALL');
  const [filterAction, setFilterAction] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, []);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterModule, filterAction, dateFrom, dateTo]);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/activity-logs');
      const data = await response.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (module: string) => {
    switch (module) {
      case 'Compliance': return <ClipboardCheck className="h-5 w-5 text-blue-500" />;
      case 'Members': return <User className="h-5 w-5 text-green-500" />;
      case 'Training': return <FileText className="h-5 w-5 text-purple-500" />;
      default: return <Settings className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CREATE': return 'bg-green-100 text-green-800 border-green-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Compute filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Search Term Filter
      const matchesSearch =
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Module Filter
      const matchesModule = filterModule === 'ALL' || log.module === filterModule;

      // 3. Action Filter
      const matchesAction = filterAction === 'ALL' || log.action === filterAction;

      // 4. Date Range Filter
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const logDate = new Date(log.created_at);
        logDate.setHours(0, 0, 0, 0);

        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (logDate < from) matchesDate = false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (logDate > to) matchesDate = false;
        }
      }

      return matchesSearch && matchesModule && matchesAction && matchesDate;
    });
  }, [logs, searchTerm, filterModule, filterAction, dateFrom, dateTo]);

  // Compute pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Unique modules and actions for dropdowns
  const uniqueModules = Array.from(new Set(logs.map(l => l.module))).filter(Boolean);
  const uniqueActions = Array.from(new Set(logs.map(l => l.action))).filter(Boolean);

  return (
    <DashboardLayout
      title="System Audit Logs"
      description="Track system activities and process changes securely"
    >
      <div className="p-6">
        <Card className="glass-card shadow-sm border-0">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Activity History
                </CardTitle>
                <CardDescription>Comprehensive log of all system modifications</CardDescription>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user or description..."
                  className="pl-9 h-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 flex flex-col lg:flex-row gap-4 items-end">

              <div className="w-full lg:w-48 space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Module
                </label>
                <Select value={filterModule} onValueChange={setFilterModule}>
                  <SelectTrigger className="h-9 bg-white">
                    <SelectValue placeholder="All Modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Modules</SelectItem>
                    {uniqueModules.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full lg:w-48 space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Action Type
                </label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="h-9 bg-white">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Actions</SelectItem>
                    {uniqueActions.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full lg:w-40 space-y-1.5 flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date From
                </label>
                <Input
                  type="date"
                  className="h-9 bg-white"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="w-full lg:w-40 space-y-1.5 flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date To
                </label>
                <Input
                  type="date"
                  className="h-9 bg-white"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom}
                />
              </div>

              <Button
                variant="outline"
                className="h-9 px-4 text-xs font-medium text-gray-500 hover:text-gray-900"
                onClick={() => {
                  setFilterModule('ALL');
                  setFilterAction('ALL');
                  setDateFrom('');
                  setDateTo('');
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </Button>

            </div>
          </CardHeader>

          <CardContent>
            {/* Logs List Area */}
            <div className="min-h-[500px]">
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-20 text-gray-400 font-medium flex flex-col items-center justify-center">
                    <Activity className="h-8 w-8 animate-spin mb-4 text-blue-500" />
                    Fetching system logs...
                  </div>
                ) : paginatedLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-gray-50/30 rounded-lg border border-dashed border-gray-200 mt-4">
                    <Clock className="h-12 w-12 mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">No activity logs found.</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search term.</p>
                  </div>
                ) : (
                  paginatedLogs.map((log) => (
                    <div key={log.id} className="group flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-100 hover:shadow-md transition-all duration-200">
                      <div className="mt-1 p-2.5 rounded-full bg-blue-50/50 border border-blue-100/50 group-hover:bg-blue-100/50 group-hover:scale-110 transition-all duration-300">
                        {getIcon(log.module)}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              <span className="font-bold text-blue-700">{log.user_name}</span>
                              <span className="text-gray-500 mx-1.5">performed</span>
                              <Badge variant="outline" className={`text-[10px] tracking-wider uppercase font-bold px-2 py-0.5 ${getActionColor(log.action)}`}>
                                {log.action}
                              </Badge>
                            </p>
                            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                              {log.description}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 sm:mt-0 mt-2">
                            <span className="text-xs font-medium text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                              {new Date(log.created_at).toLocaleString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <Badge variant="secondary" className="text-[10px] uppercase font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200">
                              {log.module}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Internal Pagination Controls */}
            {!loading && filteredLogs.length > 0 && (
              <div className="mt-6 pt-4 border-t flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)}</span> of <span className="font-medium text-foreground">{filteredLogs.length}</span> logs
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous Page</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Logic to show pages around current page if there are many pages
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage > 3) {
                          pageNum = currentPage - 2 + i;
                          if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                        }
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next Page</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SystemLogs;