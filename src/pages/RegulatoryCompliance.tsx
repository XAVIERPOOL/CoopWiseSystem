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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { AlertCircle, CheckCircle, Clock, Search, ArrowLeft, ArrowRight, Download, ExternalLink, ShieldCheck, FileCheck2, Info, Building2, UploadCloud } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ComplianceRecord {
  id: string | number;
  cooperative_name: string;
  cooperative_type?: string;
  requirement_name: string;
  status: 'compliant' | 'non-compliant' | 'pending';
  submitted_date: string;
  deadline: string;
  reviewer_notes?: string;
  file_url?: string;
}

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

const RegulatoryCompliance = () => {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<'categories' | 'cooperatives' | 'list'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCooperative, setSelectedCooperative] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cooperatives, setCooperatives] = useState<{ id: string; name: string }[]>([]);
  
  const [previewFile, setPreviewFile] = useState<{ url: string, name: string } | null>(null);

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.getComplianceRecords();
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Failed to fetch records", error);
      toast({
        title: "Connection Error",
        description: "Could not load compliance records from the database.",
        variant: "destructive"
      });
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (record: ComplianceRecord, newStatus: string) => {
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        toast({ title: "Error", description: "Not logged in.", variant: "destructive" });
        return;
      }

      const isVirtual = typeof record.id === 'string' && record.id.startsWith('missing-');

      if (isVirtual) {
        const coopTypeObj = COOPERATIVE_CATEGORIES.find(c => c.id === selectedCategory);
        const coopType = coopTypeObj ? coopTypeObj.id : 'Uncategorized';

        const { error } = await api.createComplianceRecord({
          cooperative_name: record.cooperative_name,
          cooperative_type: coopType,
          requirement_name: record.requirement_name,
          status: newStatus,
          submitted_date: new Date().toISOString(),
          reviewed_by: currentUserId
        });

        if (error) throw error;
        
        // Re-fetch records to get the updated database ID instead of the virtual ID
        fetchRecords();

        toast({
          title: "Requirement Updated",
          description: `${record.cooperative_name}'s ${record.requirement_name} marked as ${newStatus}`
        });
      } else {
        const { error } = await api.updateComplianceStatus(record.id.toString(), {
          status: newStatus as any,
          reviewed_by: currentUserId,
          submitted_date: new Date().toISOString()
        });

        if (error) throw error;

        // Update locally for immediate UX
        setRecords(records.map(r => r.id === record.id ? { ...r, status: newStatus as any } : r));

        toast({
          title: "Status Updated",
          description: `${record.cooperative_name}'s document marked as ${newStatus}`
        });
      }
    } catch (error) {
      console.error("Update failed", error);
      toast({ title: "Update Failed", description: "Network error occurred.", variant: "destructive" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, record: ComplianceRecord) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a file smaller than 5MB.", variant: "destructive" });
      return;
    }

    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      toast({ title: "Error", description: "Not logged in.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const isVirtual = typeof record.id === 'string' && record.id.startsWith('missing-');

      try {
        if (isVirtual) {
          const coopTypeObj = COOPERATIVE_CATEGORIES.find(c => c.id === selectedCategory);
          const coopType = coopTypeObj ? coopTypeObj.id : 'Uncategorized';

          const { error } = await api.createComplianceRecord({
            cooperative_name: record.cooperative_name,
            cooperative_type: coopType,
            requirement_name: record.requirement_name,
            status: 'pending',
            submitted_date: new Date().toISOString(),
            reviewed_by: currentUserId,
            file_url: base64String
          });
          if (error) throw error;
          
          fetchRecords();
          toast({ title: "Document Uploaded", description: `Uploaded document for ${record.requirement_name}` });
        } else {
          const { error } = await api.updateComplianceStatus(record.id.toString(), {
            status: record.status as any,
            reviewed_by: currentUserId,
            submitted_date: new Date().toISOString(),
            file_url: base64String
          });
          if (error) throw error;

          setRecords(records.map(r => r.id === record.id ? { ...r, file_url: base64String } : r));
          toast({ title: "Document Uploaded", description: `Updated document for ${record.cooperative_name}` });
        }
      } catch (err) {
        console.error("Upload failed", err);
        toast({ title: "Upload Failed", description: "Network error occurred.", variant: "destructive" });
      }
    };
    reader.readAsDataURL(file);
  };


  const cooperativeStatuses = useMemo(() => {
    const groups: Record<string, { type: string, records: ComplianceRecord[] }> = {};
    records.forEach(r => {
      const name = r.cooperative_name || 'Unknown Cooperative';
      if (!groups[name]) groups[name] = { type: r.cooperative_type || 'Uncategorized', records: [] };
      groups[name].records.push(r);
    });

    const EXACT_REQUIREMENTS = ['Certificate of Compliance', "Mayor's Permit", 'CAPR'];

    return Object.keys(groups).map(name => {
      const coop = groups[name];
      let isCompliant = true;
      let hasNonCompliant = false;

      const allDisplayRecords = EXACT_REQUIREMENTS.map(reqName => {
        const found = coop.records.find(r => r.requirement_name.toLowerCase() === reqName.toLowerCase());
        if (found) return found;
        return { status: 'pending' };
      });

      coop.records.forEach(r => {
        if (!EXACT_REQUIREMENTS.some(req => req.toLowerCase() === (r.requirement_name || '').toLowerCase())) {
          allDisplayRecords.push(r);
        }
      });

      allDisplayRecords.forEach(r => {
        if (r.status !== 'compliant') isCompliant = false;
        if (r.status === 'non-compliant' || r.status === 'non_compliant') hasNonCompliant = true;
      });

      let overallStatus = 'pending';
      if (isCompliant) overallStatus = 'compliant';
      else if (hasNonCompliant) overallStatus = 'non-compliant';

      return {
        name,
        type: coop.type,
        status: overallStatus
      };
    });
  }, [records]);

  const categoryMetrics = useMemo(() => {
    const metrics: Record<string, { compliantCount: number; pendingCount: number }> = {};
    COOPERATIVE_CATEGORIES.forEach(cat => {
      metrics[cat.id] = { compliantCount: 0, pendingCount: 0 };
    });

    cooperativeStatuses.forEach(coop => {
      let matchedCategory = COOPERATIVE_CATEGORIES.find(
        cat => cat.id.toLowerCase() === coop.type.toLowerCase().trim()
      )?.id || 'Uncategorized';

      if (metrics[matchedCategory]) {
        if (coop.status === 'compliant') metrics[matchedCategory].compliantCount++;
        else metrics[matchedCategory].pendingCount++;
      }
    });

    return metrics;
  }, [cooperativeStatuses]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setView('cooperatives');
    setSearchTerm('');
    setStatusFilter('all');
    setSelectedCooperative(null);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setView('categories');
    setSelectedCooperative(null);
  };

  const handleBackToCooperatives = () => {
    setView('cooperatives');
    setSelectedCooperative(null);
    setSearchTerm('');
    setStatusFilter('all');
  };

  const overallMetrics = useMemo(() => {
    let compliant = 0, pending = 0, nonCompliant = 0;
    cooperativeStatuses.forEach(c => {
      if (c.status === 'compliant') compliant++;
      else if (c.status === 'pending') pending++;
      else nonCompliant++;
    });
    return [
      { name: 'Compliant', value: compliant, color: '#10b981' }, // Emerald
      { name: 'Pending Review', value: pending, color: '#f59e0b' }, // Amber
      { name: 'Non-Compliant', value: nonCompliant, color: '#f43f5e' } // Rose
    ];
  }, [cooperativeStatuses]);

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

    toast({ title: "Export Successful", description: "Records downloaded successfully." });
  };

  const getDeadlineStatus = (deadlineStr: string, status: string) => {
    if (status === 'compliant') return 'normal';
    if (!deadlineStr) return 'normal';
    
    const deadline = new Date(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 14) return 'upcoming';
    return 'normal';
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] select-none';
      case 'non-compliant': 
      case 'non_compliant': return 'bg-rose-100 text-rose-800 border-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] select-none';
      default: return 'bg-amber-100 text-amber-800 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] select-none';
    }
  };

  const filteredRecords = useMemo(() => {
    let result = records.filter(record => {
      if (!selectedCategory) return false;
      const typeStr = record.cooperative_type || 'Uncategorized';
      if (typeStr.toLowerCase().trim() !== selectedCategory.toLowerCase().trim()) return false;
      
      if (selectedCooperative && view === 'list' && record.cooperative_name !== selectedCooperative) return false;
      
      if (statusFilter !== 'all' && record.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          record.cooperative_name?.toLowerCase().includes(term) ||
          record.requirement_name?.toLowerCase().includes(term)
        );
      }
      return true;
    });

    result.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [records, selectedCategory, statusFilter, searchTerm, sortOrder, selectedCooperative, view]);

  const groupedCooperatives = useMemo(() => {
    if (view !== 'cooperatives') return [];
    
    const recordsByCoop: Record<string, ComplianceRecord[]> = {};
    filteredRecords.forEach(r => {
      const name = r.cooperative_name || 'Unknown Cooperative';
      if (!recordsByCoop[name]) recordsByCoop[name] = [];
      recordsByCoop[name].push(r);
    });

    const EXACT_REQUIREMENTS = ['Certificate of Compliance', "Mayor's Permit", 'CAPR'];

    return Object.keys(recordsByCoop).map(name => {
      const coopRecords = recordsByCoop[name];
      let compliantCount = 0;
      let pendingCount = 0;
      let nonCompliantCount = 0;
      let lastSubmission: string | null = null;
      
      const allDisplayRecords = EXACT_REQUIREMENTS.map(reqName => {
        const found = coopRecords.find(r => r.requirement_name.toLowerCase() === reqName.toLowerCase());
        if (found) return found;
        return {
          status: 'pending',
          submitted_date: null
        } as unknown as ComplianceRecord;
      });

      coopRecords.forEach(r => {
        if (!EXACT_REQUIREMENTS.some(req => req.toLowerCase() === (r.requirement_name || '').toLowerCase())) {
          allDisplayRecords.push(r);
        }
      });

      allDisplayRecords.forEach(r => {
        if (r.status === 'compliant') compliantCount++;
        else if (r.status === 'pending') pendingCount++;
        else nonCompliantCount++;

        if (r.submitted_date) {
            if (!lastSubmission || new Date(r.submitted_date) > new Date(lastSubmission)) {
                lastSubmission = r.submitted_date;
            }
        }
      });

      return {
        name,
        total: allDisplayRecords.length,
        compliant: compliantCount,
        pending: pendingCount,
        nonCompliant: nonCompliantCount,
        lastSubmission
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredRecords, view]);

  const cooperativeDisplayRecords = useMemo(() => {
    if (view !== 'list' || !selectedCooperative) return [];
    
    const EXACT_REQUIREMENTS = ['Certificate of Compliance', "Mayor's Permit", 'CAPR'];
    
    const result = EXACT_REQUIREMENTS.map(reqName => {
      const found = filteredRecords.find(r => r.requirement_name.toLowerCase() === reqName.toLowerCase());
      if (found) return found;
      return {
        id: `missing-${reqName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
        cooperative_name: selectedCooperative,
        requirement_name: reqName,
        status: 'pending',
        deadline: '',
      } as ComplianceRecord;
    });

    filteredRecords.forEach(r => {
      if (!EXACT_REQUIREMENTS.some(req => 
        req.toLowerCase() === (r.requirement_name || '').toLowerCase()
      )) {
        result.push(r);
      }
    });

    return result;
  }, [filteredRecords, selectedCooperative, view]);

  return (
    <DashboardLayout
      title="Regulatory Compliance"
      description="Monitor and manage legal compliance across all registered cooperatives."
    >
      <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">

        {/* --- PREMIUM BANNER --- */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-800 text-white shadow-xl p-8 border border-white/10 group">
          <div className="absolute inset-0 opacity-20 transition-opacity duration-1000 group-hover:opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #60a5fa 0%, transparent 60%)' }} />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/20 blur-3xl rounded-full mix-blend-screen pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <ShieldCheck className="w-10 h-10 text-blue-300" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">Compliance Center</h1>
                <p className="text-blue-200/80 font-medium mt-1">Live tracking of legal and operational regulations.</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600/20 border-t-blue-600" />
          </div>
        ) : view === 'categories' ? (
          <div className="space-y-8">
            {/* Overall Metrics Glass Widget */}
            <Card className="glass-card shadow-lg border-white/50 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500" />
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row items-center justify-around gap-12">
                  <div className="w-full lg:w-1/3 flex flex-col items-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-indigo-600" /> System Health
                    </h3>
                    <div className="h-56 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={overallMetrics}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                          >
                            {overallMetrics.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value: number) => [`${value} Cooperatives`]} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-3xl font-black text-slate-800">{cooperativeStatuses.length}</span>
                        <span className="text-xs font-bold text-slate-400 tracking-wider">TOTAL</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {overallMetrics.map((metric) => (
                      <div key={metric.name} className="flex flex-col justify-center p-6 border border-slate-100 rounded-2xl bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: metric.color }}></div>
                          <span className="font-bold text-slate-600 text-sm tracking-wide uppercase">{metric.name}</span>
                        </div>
                        <span className="text-4xl font-black" style={{ color: metric.color }}>{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-xl font-bold mt-2 mb-6 flex items-center gap-2 text-slate-800">
                <Building2 className="w-6 h-6 text-indigo-600" /> Sector Analysis
              </h3>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {COOPERATIVE_CATEGORIES.map((category) => {
                  const metric = categoryMetrics[category.id] || { compliantCount: 0, pendingCount: 0 };
                  const total = metric.compliantCount + metric.pendingCount;
                  const isZero = total === 0;

                  return (
                    <Card
                      key={category.id}
                      className={`relative overflow-hidden cursor-pointer transition-all duration-300 border border-slate-200 shadow-sm
                        ${isZero ? 'opacity-70 hover:opacity-100' : 'hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300'}
                      `}
                      onClick={() => handleCategoryClick(category.id)}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Building2 className="w-24 h-24" />
                      </div>
                      
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-slate-800 leading-tight w-3/4">{category.label}</h4>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold">{total}</Badge>
                        </div>
                        
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 h-8 mb-6">
                          {category.description}
                        </p>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm font-semibold">
                            <span className="flex items-center gap-2 text-emerald-600">
                              <CheckCircle className="w-4 h-4" /> Compliant
                            </span>
                            <span className="text-slate-800">{metric.compliantCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm font-semibold">
                            <span className="flex items-center gap-2 text-amber-600">
                              <Clock className="w-4 h-4" /> Pending
                            </span>
                            <span className="text-slate-800">{metric.pendingCount}</span>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-600 uppercase tracking-wider group-hover:text-indigo-700">
                          View Details <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        ) : view === 'cooperatives' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Button variant="ghost" className="gap-2 font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0" onClick={handleBackToCategories}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to Categories
                </Button>
                <div className="h-6 w-px bg-slate-200 hidden md:block shrink-0" />
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 truncate">
                  <Building2 className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span className="truncate">{COOPERATIVE_CATEGORIES.find(c => c.id === selectedCategory)?.label}</span>
                </h2>
              </div>

              <div className="flex flex-wrap w-full md:w-auto gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search cooperatives..."
                    className="pl-9 bg-slate-50 border-slate-200 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-slate-50 border-slate-200 font-medium">
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groupedCooperatives.map(coop => (
                <Card key={coop.name} className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200 group relative overflow-hidden bg-white/60 backdrop-blur-sm">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                    <Building2 className="w-32 h-32" />
                  </div>
                  <CardContent className="p-6 relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-extrabold text-lg text-slate-800 line-clamp-2">{coop.name}</h4>
                    </div>
                    
                    <div className="space-y-4 mt-auto mb-6">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-slate-500">Total Requirements</span>
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">{coop.total} documents</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden shadow-inner">
                        <div style={{ width: `${(coop.compliant / coop.total) * 100}%` }} className="bg-emerald-500 h-full" />
                        <div style={{ width: `${(coop.pending / coop.total) * 100}%` }} className="bg-amber-500 h-full" />
                        <div style={{ width: `${(coop.nonCompliant / coop.total) * 100}%` }} className="bg-rose-500 h-full" />
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold pt-1">
                        <span className="text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md"><CheckCircle className="w-3.5 h-3.5"/> {coop.compliant}</span>
                        <span className="text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md"><Clock className="w-3.5 h-3.5"/> {coop.pending}</span>
                        <span className="text-rose-600 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-md"><AlertCircle className="w-3.5 h-3.5"/> {coop.nonCompliant}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 hover:border-indigo-300 shadow-sm transition-all group-hover:bg-indigo-600 group-hover:text-white"
                      size="lg"
                      onClick={() => {
                        setSelectedCooperative(coop.name);
                        setView('list');
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                    >
                      View Documents <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {groupedCooperatives.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Info className="w-12 h-12 text-slate-300" />
                    <p className="font-bold text-lg text-slate-500">No cooperatives found.</p>
                    <p className="font-medium text-sm text-slate-400">Try adjusting your filters or search terms.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                <Button variant="ghost" className="gap-2 font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0" onClick={handleBackToCooperatives}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="h-6 w-px bg-slate-200 hidden md:block shrink-0" />
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 truncate" title={selectedCooperative || ''}>
                  <FileCheck2 className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span className="truncate">{selectedCooperative} Documents</span>
                </h2>
              </div>

              <div className="flex flex-wrap w-full md:w-auto gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search records..."
                    className="pl-9 bg-slate-50 border-slate-200 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-slate-50 border-slate-200 font-medium">
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
                  <SelectTrigger className="w-full sm:w-[170px] bg-slate-50 border-slate-200 font-medium">
                    <SelectValue placeholder="Sort Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Earliest Deadline</SelectItem>
                    <SelectItem value="desc">Latest Deadline</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="gap-2 w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold" onClick={handleExportCSV}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <Card className="glass-card shadow-lg border-white/50 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80 backdrop-blur-sm">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-extrabold text-slate-700 py-4 px-6 rounded-tl-xl text-left">Requirement</TableHead>
                      <TableHead className="font-extrabold text-slate-700">Due Date</TableHead>
                      <TableHead className="font-extrabold text-slate-700">Status</TableHead>
                      <TableHead className="font-extrabold text-slate-700 rounded-tr-xl w-[200px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cooperativeDisplayRecords.length > 0 ? (
                      cooperativeDisplayRecords.map((record) => {
                        const deadlineStatus = getDeadlineStatus(record.deadline, record.status);
                        return (
                          <TableRow
                            key={record.id}
                            className={`transition-colors border-b border-slate-100 hover:bg-slate-50
                              ${deadlineStatus === 'overdue' ? 'bg-rose-50/30' : ''}
                              ${deadlineStatus === 'upcoming' ? 'bg-amber-50/30' : ''}
                            `}
                          >
                            <TableCell className="font-bold text-slate-800 px-6 py-4 text-left">
                              {record.requirement_name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 font-semibold text-slate-700">
                                {record.deadline ? new Date(record.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                {deadlineStatus === 'overdue' && <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3"/> Overdue</span>}
                                {deadlineStatus === 'upcoming' && <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3"/> Soon</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`capitalize px-3 py-1 font-bold ${getStatusBadgeStyles(record.status)}`}>
                                {(record.status || '').replace('-', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={record.status}
                                  onValueChange={(val) => handleUpdateStatus(record, val)}
                                >
                                  <SelectTrigger className="w-[140px] h-9 text-xs font-bold border-slate-300 focus:ring-indigo-500">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending" className="font-bold text-amber-700">Set Pending</SelectItem>
                                    <SelectItem value="compliant" className="font-bold text-emerald-700">Set Compliant</SelectItem>
                                    <SelectItem value="non-compliant" className="font-bold text-rose-700">Set Non-Compliant</SelectItem>
                                  </SelectContent>
                                </Select>
                                {record.file_url ? (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                    onClick={() => setPreviewFile({ url: record.file_url || '', name: record.requirement_name || 'Document' })}
                                    title="View Attached Document"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-slate-100 hover:text-slate-900 bg-white h-9 w-9 text-slate-500 shadow-sm" title="Upload Document">
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                      onChange={(e) => handleFileUpload(e, record)} 
                                    />
                                    <UploadCloud className="h-4 w-4" />
                                  </label>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                            <Info className="w-12 h-12 text-slate-300" />
                            <p className="font-bold text-lg text-slate-500">No matching records found.</p>
                            <p className="font-medium text-sm">Try adjusting your filters or search terms or change category.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col bg-slate-900 border-slate-800">
          <DialogHeader className="p-4 border-b border-slate-800 bg-slate-900 text-slate-200 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-medium tracking-wide">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto w-full h-full min-h-[70vh] bg-slate-950 flex items-center justify-center p-4">
            {previewFile?.url.startsWith('data:image/') ? (
              <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-md shadow-2xl" />
            ) : previewFile?.url ? (
              <iframe src={previewFile.url} className="w-full h-full min-h-[70vh] bg-white rounded-md" title={previewFile.name} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default RegulatoryCompliance;