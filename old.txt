import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock, FileText, Search, Filter, Folder, ArrowLeft, ArrowRight, Download, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

// Define interfaces for type safety
interface ComplianceRecord {
  id: string;
  cooperative_name: string;
  cooperative_type?: string;
  requirement_name: string;
  status: 'compliant' | 'non-compliant' | 'pending';
  submitted_date: string;
  deadline: string;
  reviewer_notes?: string;
  file_url?: string;
}

// Static Categories Definition
const COOPERATIVE_CATEGORIES = [
  { id: 'Agriculture', label: 'Agriculture Cooperatives', description: 'Farming, production, and agrarian compliance requirements.' },
  { id: 'Consumers', label: 'Consumers Cooperatives', description: 'Cooperatives for the distribution of consumer goods and services.' },
  { id: 'Credit', label: 'Credit Cooperatives', description: 'Financial services, savings, and loan compliance monitoring.' },
  { id: 'Federation', label: 'Federation of Cooperatives', description: 'Secondary cooperatives composed of primary cooperatives.' },
  { id: 'Health Service', label: 'Health Service Cooperatives', description: 'Medical, health, and wellness service standards.' },
  { id: 'Labor Service', label: 'Labor Service Cooperatives', description: 'Labor and skills-based service provider compliance.' },
  { id: 'Multipurpose', label: 'Multipurpose Cooperatives', description: 'Cooperatives combining two or more varied business activities.' },
  { id: 'Transport', label: 'Transport Cooperatives', description: 'Transport services and logistics compliance monitoring.' },
];

// Mock Data for visualization
const MOCK_RECORDS: ComplianceRecord[] = [
  { id: '1', cooperative_name: 'BICOL CARDIOVASCULAR DIAGNOSTIC COOPERATIVE (BCDC)', cooperative_type: 'Health Service', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-15', deadline: '2024-04-30', file_url: '/dummy-file.pdf' },
  { id: '2', cooperative_name: 'BICOL CENTRAL STATION CREDIT COOPERATIVE (BICEST CC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-20', deadline: '2024-04-30' },
  { id: '3', cooperative_name: 'BICOL ENTREPRENEURS AND TRADERS CREDIT COOPERATIVE (BETCO)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-01', deadline: '2024-04-30' },
  { id: '4', cooperative_name: 'BICOL MEDICAL CENTER G110 MULTIPURPOSE COOPERATIVE (BMC G110 MPC)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-10', deadline: '2024-04-30' },
  { id: '5', cooperative_name: 'BICOL PAROLE AND PROBATION ADMINISTRATION EMPLOYEES CREDIT COOPERATIVE (BPPAECC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-25', deadline: '2024-04-30' },
  { id: '6', cooperative_name: 'BICOL PRIME CREDIT COOPERATIVE (BPCC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-05', deadline: '2024-04-30' },
  { id: '7', cooperative_name: 'BICOL TRANSPORT SERVICE COOPERATIVE FEDERATION (BITSCOMFED)', cooperative_type: 'Federation', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-10', deadline: '2024-04-30' },
  { id: '8', cooperative_name: 'BIKOLANAS AGRICULTURE COOPERATIVE (BIKOLANAS)', cooperative_type: 'Agriculture', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-28', deadline: '2024-04-30' },
  { id: '9', cooperative_name: 'CAMARINES SUR ELEMENTARY AND SECONDARY TEACHERS AND EMPLOYEES CREDIT COOPERATIVE (CASESTECCO)', cooperative_type: 'Credit', requirement_name: 'Newly Registered', status: 'compliant', submitted_date: '2024-11-15', deadline: '2025-04-30', file_url: '/dummy-file.pdf', reviewer_notes: 'Newly Registered' },
  { id: '10', cooperative_name: 'CAMARINES SUR MUSLIM COMMUNITY CONSUMERS COOPERATIVE', cooperative_type: 'Consumers', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-20', deadline: '2024-04-30' },
  { id: '11', cooperative_name: 'CAROLINA PANICUASON TRANSPORT COOPERATIVE (CAPATRANSCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-15', deadline: '2024-04-30' },
  { id: '12', cooperative_name: 'CASURECO II EMPLOYEES MULTIPURPOSE COOPERATIVE (CEMPC)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-30', deadline: '2024-04-30' },
  { id: '13', cooperative_name: 'CENTRO PANGANIBAN DEL ROSARIO TRANSPORT COOPERATIVE (CEPDELTRANSCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-05', deadline: '2024-04-30' },
  { id: '14', cooperative_name: 'DEL ROSARIO PANGANIBAN CENTRO BAGONG PAG-ASA TRANSPORT COOPERATIVE (DCPC-BAPAGTRANSCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-28', deadline: '2024-04-30' },
  { id: '15', cooperative_name: 'D\'MARILLAC\'S MULTIPURPOSE AND TRANSPORT SERVICE COOPERATIVE', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-12', deadline: '2024-04-30' },
  { id: '16', cooperative_name: 'FEDERATION OF AGRICULTURE COOPERATIVES IN CAMARINES SUR (FACCS)', cooperative_type: 'Federation', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-12', deadline: '2024-04-30' },
  { id: '17', cooperative_name: 'GOLDEN BLUE CONSUMERS COOPERATIVE', cooperative_type: 'Consumers', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-10', deadline: '2024-04-30' },
  { id: '18', cooperative_name: 'GOLDEN HIGHLANDS AGRICULTURE COOPERATIVE', cooperative_type: 'Agriculture', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-22', deadline: '2024-04-30' },
  { id: '19', cooperative_name: 'GREEN AND GOLD MULTIPURPOSE COOPERATIVE (GGMPC)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-18', deadline: '2024-04-30' },
  { id: '20', cooperative_name: 'MAGSAYSAY ALLIED TRANSPORT COOPERATIVE (MATCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-14', deadline: '2024-04-30' },
  { id: '21', cooperative_name: 'METRO NAGA WATER DISTRICT EMPLOYEES MULTIPURPOSE COOPERATIVE (MNWD EMPC)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-08', deadline: '2024-04-30' },
  { id: '22', cooperative_name: 'MOTHER SETON HOSPITAL EMPLOYEES CREDIT COOPERATIVE (MSH ECC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-20', deadline: '2024-04-30' },
  { id: '23', cooperative_name: 'MULTI-AGRI-FOREST AND COMMUNITY DEVELOPMENT COOPERATIVE (MAFCOOP)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-02', deadline: '2024-04-30' },
  { id: '24', cooperative_name: 'NAGA CALABANGA NORTHBOUND TRANSPORT COOPERATIVE', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-18', deadline: '2024-04-30' },
  { id: '25', cooperative_name: 'NAGA CITY ALLIED TRANSPORT COOPERATIVE (NACIATRASCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-05', deadline: '2024-04-30' },
  { id: '26', cooperative_name: 'NAGA CITY EMPLOYEES & WORKERS COOPERATIVE (NACEMWCO)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-30', deadline: '2024-04-30' },
  { id: '27', cooperative_name: 'NAGA CITY MIGRANT WORKERS CONSUMERS COOPERATIVE (NACIMICCO)', cooperative_type: 'Consumers', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-20', deadline: '2024-04-30' },
  { id: '28', cooperative_name: 'NAGA CITY PEOPLE\'S MALL CREDIT COOPERATIVE (NACIPEMCCO)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-25', deadline: '2024-04-30' },
  { id: '29', cooperative_name: 'NAGA CITY VISUALLY IMPAIRED TRANSPORT COOPERATIVE (NACIVITRANSCO)', cooperative_type: 'Transport', requirement_name: 'Newly Registered', status: 'compliant', submitted_date: '2024-10-10', deadline: '2025-04-30', reviewer_notes: 'Newly Registered' },
  { id: '30', cooperative_name: 'NAGA COLLEGE FOUNDATION MULTIPURPOSE COOPERATIVE (NCF MPC)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-22', deadline: '2024-04-30' },
  { id: '31', cooperative_name: 'NAGA IMAGING CENTER COOPERATIVE (NICC)', cooperative_type: 'Health Service', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-18', deadline: '2024-04-30' },
  { id: '32', cooperative_name: 'NAGA-DARAGA TRANSPORT COOPERATIVE (NADATRANSCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-10', deadline: '2024-04-30' },
  { id: '33', cooperative_name: 'PAGLAOM CREDIT COOPERATIVE (PAGLAOM CC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-08', deadline: '2024-04-30' },
  { id: '34', cooperative_name: 'PEACE AND UNITY MULTIPURPOSE COOPERATIVE (PUMPCO)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-12', deadline: '2024-04-30' },
  { id: '35', cooperative_name: 'PHILIPPINE FEDERATION OF CREDIT COOPERATIVES - BICOL (PFCCO - BICOL)', cooperative_type: 'Federation', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-28', deadline: '2024-04-30' },
  { id: '36', cooperative_name: 'PINAG-ISANG SAMAHAN TSUPER TRISEKEL OPERATOR SA NAGA DEVELOPMENT MULTIPURPOSE & TRANSPORT SERVICE COOPERATIVE (PISTTON)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-14', deadline: '2024-04-30' },
  { id: '37', cooperative_name: 'SAN FELIPE NAGA TRANSPORT COOPERATIVE (SAFETRANSCO)', cooperative_type: 'Transport', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-15', deadline: '2024-04-30' },
  { id: '38', cooperative_name: 'SAN ISIDRO (SN) DEVELOPMENT COOPERATIVE (SIDECO)', cooperative_type: 'Multipurpose', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-26', deadline: '2024-04-30' },
  { id: '39', cooperative_name: 'ST. LOUISE COOPERATIVE', cooperative_type: 'Health Service', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-02', deadline: '2024-04-30' },
  { id: '40', cooperative_name: 'SUGAR PLANTERS AGRICULTURE COOPERATIVE', cooperative_type: 'Agriculture', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-01-08', deadline: '2024-04-30' },
  { id: '41', cooperative_name: 'TRADE CREDIT COOPERATIVE (TCC)', cooperative_type: 'Credit', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-04-05', deadline: '2024-04-30' },
  { id: '42', cooperative_name: 'UMASARIG AGRICULTURE COOPERATIVE (UMACOOP)', cooperative_type: 'Agriculture', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-02-16', deadline: '2024-04-30' },
  { id: '43', cooperative_name: 'UNIFIED LABOR SERVICE COOPERATIVE', cooperative_type: 'Labor Service', requirement_name: 'Certificate of Compliance', status: 'compliant', submitted_date: '2024-03-26', deadline: '2024-04-30' },
  { id: '44', cooperative_name: 'USWAG FARMERS AGRICULTURE COOPERATIVE (UFAC)', cooperative_type: 'Agriculture', requirement_name: 'Newly Registered', status: 'compliant', submitted_date: '2024-09-15', deadline: '2025-04-30', reviewer_notes: 'Newly Registered' },
];

const RegulatoryCompliance = () => {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // View State
  const [view, setView] = useState<'categories' | 'list'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter/Search State for List View
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Dialog/Update State
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);

      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log("Using predefined 44 cooperatives data for Regulatory Compliance");

      // Load from localStorage to persist across hard refreshes
      const savedRecords = localStorage.getItem('mockComplianceRecords');
      if (savedRecords) {
        setRecords(JSON.parse(savedRecords));
      } else {
        // First load: save default MOCK_RECORDS to localStorage
        localStorage.setItem('mockComplianceRecords', JSON.stringify(MOCK_RECORDS));
        setRecords([...MOCK_RECORDS]);
      }
    } catch (error) {
      console.error("Failed to fetch records", error);
      setRecords([...MOCK_RECORDS]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRecord) return;

    try {
      const currentUserId = localStorage.getItem('userId');

      if (!currentUserId) {
        toast({
          title: "Error",
          description: "User session invalid. Please login again to update records.",
          variant: "destructive"
        });
        return;
      }

      const updateData = {
        status: status,
        reviewer_notes: notes,
        reviewed_by: currentUserId,
        submitted_date: new Date().toISOString()
      };

      const { error } = await api.updateComplianceStatus(selectedRecord.id, updateData as any);

      if (!error) {
        toast({
          title: "Status Updated",
          description: `Compliance record marked as ${status}`,
        });
        setIsDialogOpen(false);
        fetchRecords(); // Refresh list to reflect changes
      } else {
        throw new Error(error.message || 'Failed to update');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update the compliance record.",
        variant: "destructive",
      });
    }
  };

  const categoryMetrics = useMemo(() => {
    const metrics: Record<string, { compliantCount: number; pendingCount: number }> = {};

    // Initialize with 0 for all static categories
    COOPERATIVE_CATEGORIES.forEach(cat => {
      metrics[cat.id] = { compliantCount: 0, pendingCount: 0 };
    });

    records.forEach(record => {
      // Find matching category ID exactly
      const typeStr = record.cooperative_type || 'Uncategorized';
      // Find ensuring exact string casing match, falling back to uncategorized if spelling is slightly off
      let matchedCategory = COOPERATIVE_CATEGORIES.find(
        cat => cat.id.toLowerCase() === typeStr.toLowerCase().trim()
      )?.id || 'Uncategorized';

      if (metrics[matchedCategory]) {
        if (record.status === 'compliant') {
          metrics[matchedCategory].compliantCount++;
        } else if (record.status === 'pending') {
          metrics[matchedCategory].pendingCount++;
        }
      }
    });

    return metrics;
  }, [records]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setView('list');
    setSearchTerm(''); // Reset search when entering a category
    setStatusFilter('all');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setView('categories');
  };

  const overallMetrics = useMemo(() => {
    let compliant = 0;
    let pending = 0;
    let nonCompliant = 0;
    records.forEach(r => {
      if (r.status === 'compliant') compliant++;
      else if (r.status === 'pending') pending++;
      else if (r.status === 'non-compliant') nonCompliant++;
    });
    return [
      { name: 'Compliant', value: compliant, color: '#10b981' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Non-Compliant', value: nonCompliant, color: '#ef4444' }
    ];
  }, [records]);

  const handleExportCSV = () => {
    const headers = ['Cooperative Name', 'Requirement', 'Status', 'Submitted Date', 'Deadline', 'Reviewer Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(r =>
        `"${r.cooperative_name || ''}","${r.requirement_name || ''}","${r.status || ''}","${r.submitted_date || ''}","${r.deadline || ''}","${(r.reviewer_notes || '').replace(/"/g, '""')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `compliance_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Compliance records have been downloaded to your device.",
    });
  };

  const getDeadlineStatus = (deadlineStr: string, status: string) => {
    if (status === 'compliant') return 'normal';
    const deadline = new Date(deadlineStr);
    const today = new Date();
    // Reset time for accurate day comparison
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'upcoming';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'non-compliant': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    }
  };

  const filteredRecords = useMemo(() => {
    let result = records.filter(record => {
      if (!selectedCategory) return false;

      // Filter by category match
      const typeStr = record.cooperative_type || 'Uncategorized';
      const isMatch = typeStr.toLowerCase().trim() === selectedCategory.toLowerCase().trim();

      if (!isMatch) return false;

      // Filter by status
      if (statusFilter !== 'all' && record.status !== statusFilter) return false;

      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          record.cooperative_name?.toLowerCase().includes(term) ||
          record.requirement_name?.toLowerCase().includes(term)
        );
      }

      return true;
    });

    // Sort by Due Date
    result.sort((a, b) => {
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [records, selectedCategory, statusFilter, searchTerm, sortOrder]);

  return (
    <DashboardLayout
      title="Regulatory Compliance"
      description="Monitor and review cooperative compliance requirements"
    >
      <div className="p-6 space-y-6">

        {/* Category Dashboard View */}
        {view === 'categories' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Overall Compliance Health</CardTitle>
                <CardDescription>System-wide view of cooperative compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  <div className="h-64 w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={overallMetrics}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {overallMetrics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => [value, 'Count']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-4 w-full md:w-1/2">
                    {overallMetrics.map((metric) => (
                      <div key={metric.name} className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }}></div>
                          <span className="font-semibold">{metric.name}</span>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: metric.color }}>{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <h3 className="text-lg font-semibold mt-8 mb-4">Compliance By Category</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {COOPERATIVE_CATEGORIES.map((category) => {
                const metric = categoryMetrics[category.id] || { compliantCount: 0, pendingCount: 0 };
                return (
                  <Card
                    key={category.id}
                    className="cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-1 duration-200"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">
                        {category.label}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Compliance Status:
                        </h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                            <CheckCircle className="h-4 w-4" />
                            <span>{metric.compliantCount} Fully Compliant</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-amber-500 font-medium">
                            <AlertCircle className="h-4 w-4" />
                            <span>{metric.pendingCount} Pending Review</span>
                          </div>
                        </div>
                        <div className="pt-2">
                          <span className="text-xs text-primary flex items-center gap-1 font-semibold group-hover:underline">
                            View List <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed List View */}
        {view === 'list' && selectedCategory && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Button variant="ghost" className="gap-2" onClick={handleBackToCategories}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to Categories
                </Button>
                <h2 className="text-xl font-semibold hidden md:block">
                  {COOPERATIVE_CATEGORIES.find(c => c.id === selectedCategory)?.label} List
                </h2>
              </div>

              <div className="flex flex-wrap w-full md:w-auto gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(val: 'asc' | 'desc') => setSortOrder(val)}>
                  <SelectTrigger className="w-full sm:w-[170px]">
                    <SelectValue placeholder="Sort by Due Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Due Date (Soonest)</SelectItem>
                    <SelectItem value="desc">Due Date (Latest)</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={handleExportCSV}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Compliance Records</CardTitle>
                <CardDescription>
                  Managing records for {COOPERATIVE_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cooperative Name</TableHead>
                      <TableHead>Requirement</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => {
                        const deadlineStatus = getDeadlineStatus(record.deadline, record.status);
                        return (
                          <TableRow
                            key={record.id}
                            className={
                              deadlineStatus === 'overdue' ? 'bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30' :
                                deadlineStatus === 'upcoming' ? 'bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30' : ''
                            }
                          >
                            <TableCell className="font-medium">{record.cooperative_name}</TableCell>
                            <TableCell>{record.requirement_name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {new Date(record.deadline).toLocaleDateString()}
                                {deadlineStatus === 'overdue' && <Badge variant="destructive" className="text-[10px] h-5 px-1 bg-red-500">Overdue</Badge>}
                                {deadlineStatus === 'upcoming' && <Badge variant="outline" className="text-[10px] h-5 px-1 border-amber-500 text-amber-600 dark:text-amber-400">Due Soon</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(record.status)}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={record.status}
                                  onValueChange={async (newStatus) => {
                                    try {
                                      const currentUserId = localStorage.getItem('userId');
                                      if (!currentUserId) {
                                        toast({ title: "Error", description: "Not logged in.", variant: "destructive" });
                                        return;
                                      }

                                      // Update locally first for immediate UI response
                                      const updatedRecords = records.map(r =>
                                        r.id === record.id ? { ...r, status: newStatus as any } : r
                                      );
                                      setRecords(updatedRecords);

                                      // Save the updated state to localStorage for persistence across hard reloads
                                      localStorage.setItem('mockComplianceRecords', JSON.stringify(updatedRecords));

                                      // Then attempt server update (will fail for mock IDs, but we catch it)
                                      try {
                                        await api.updateComplianceStatus(record.id, {
                                          status: newStatus,
                                          reviewed_by: currentUserId,
                                          submitted_date: new Date().toISOString()
                                        } as any);
                                      } catch (apiError) {
                                        console.warn("API update failed, but local state was updated.", apiError);
                                      }

                                      toast({
                                        title: "Status Updated",
                                        description: `Changed to ${newStatus}`
                                      });
                                    } catch (e) {
                                      toast({ title: "Update Failed", variant: "destructive" });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-[140px] h-8 text-xs">
                                    <SelectValue placeholder="Update Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="compliant">Compliant</SelectItem>
                                    <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                                  </SelectContent>
                                </Select>
                                {record.file_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs px-2"
                                    onClick={() => window.open(record.file_url, '_blank')}
                                    title="View Document"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No records found matching your search in this category.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RegulatoryCompliance;