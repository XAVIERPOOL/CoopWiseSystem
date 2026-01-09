import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ClipboardCheck, 
  User, 
  FileText, 
  Settings, 
  Activity,
  Search,
  Clock
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

const SystemLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      // Fetch logs from our API endpoint
      const response = await fetch('http://localhost:3001/api/activity-logs');
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

  const filteredLogs = logs.filter(log => 
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout 
      title="System Audit Logs" 
      description="Track system activities and process changes"
    >
      <div className="p-6">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Activity History
                </CardTitle>
                <CardDescription>Real-time log of all system modifications</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by user or action..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-10">Loading logs...</div>
                ) : filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Clock className="h-12 w-12 mb-2 opacity-20" />
                    <p>No activity logs found.</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="mt-1 p-2 rounded-full bg-background border shadow-sm">
                        {getIcon(log.module)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              <span className="font-bold text-primary">{log.user_name}</span>
                              <span className="text-muted-foreground mx-1">performed</span>
                              <Badge variant="outline" className={`text-xs ${getActionColor(log.action)}`}>
                                {log.action}
                              </Badge>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {log.description}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {log.module}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SystemLogs;