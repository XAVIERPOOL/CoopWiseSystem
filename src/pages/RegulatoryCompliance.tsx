import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { 
  ClipboardCheck,
  Plus,
  Search,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Building2,
  Calendar,
  FileText,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';

interface ComplianceRecord {
  id: string;
  cooperative_id: string;
  cooperative_name?: string;
  coop_id?: string;
  requirement_type: string;
  requirement_name: string;
  description: string;
  due_date: string;
  submitted_date: string;
  status: string;
  documents: any[];
  reviewer_notes: string;
  year: number;
  created_at: string;
}

interface Cooperative {
  id: string;
  name: string;
  coop_id: string;
}

interface Summary {
  total: string;
  compliant: string;
  pending: string;
  non_compliant: string;
  overdue: string;
  past_due: string;
}

interface CooperativeComplianceSummary {
  total: number;
  compliant: number;
  pending: number;
  overdue: number;
  submitted: number;
  non_compliant: number;
}

const STATUS_ORDER = ['overdue', 'pending', 'submitted', 'compliant', 'non_compliant'] as const;

const STATUS_CONFIG = {
  overdue: {
    label: 'Overdue',
    description: 'Past due date requirements',
    icon: AlertTriangle,
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    headerColor: 'bg-red-100 dark:bg-red-900/30',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  pending: {
    label: 'Pending',
    description: 'Awaiting submission',
    icon: Clock,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    headerColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  submitted: {
    label: 'Submitted',
    description: 'Awaiting review',
    icon: FileText,
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    headerColor: 'bg-blue-100 dark:bg-blue-900/30',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  compliant: {
    label: 'Compliant',
    description: 'Requirements fulfilled',
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    headerColor: 'bg-green-100 dark:bg-green-900/30',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  non_compliant: {
    label: 'Non-Compliant',
    description: 'Requirements not met',
    icon: XCircle,
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
    headerColor: 'bg-gray-100 dark:bg-gray-900/30',
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  },
};

const REQUIREMENT_TYPES = [
  'Mayors Permit',
  'Certificate of Compliance',
  'CAPR Submission',
  'Other'
];

const RegulatoryCompliance = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'officer';
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [allRecords, setAllRecords] = useState<ComplianceRecord[]>([]);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overdue: true,
    pending: true,
    submitted: true,
    compliant: false,
    non_compliant: false,
  });
  
  const [selectedCooperative, setSelectedCooperative] = useState<Cooperative | null>(null);
  const [coopSearchTerm, setCoopSearchTerm] = useState('');
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cooperative_id: '',
    requirement_type: '',
    requirement_name: '',
    description: '',
    due_date: '',
    year: new Date().getFullYear(),
  });

  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchCooperatives();
  }, []);

  useEffect(() => {
    if (selectedCooperative) {
      fetchRecords();
    } else {
      setRecords([]);
      setAllRecords([]);
    }
  }, [selectedCooperative, filterYear]);

  // we only want to load 'approved' cooperatives here because pending ones are  not required to submit compliance documents yet//

  const fetchCooperatives = async () => {
    try {
      setLoading(true);
      const coopsRes = await api.getCooperatives('approved');
      if (coopsRes.error) throw coopsRes.error;
      setCooperatives(coopsRes.data || []);
    } catch (error) {
      console.error('Error fetching cooperatives:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch cooperatives',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    if (!selectedCooperative) return;
    try {
      setLoading(true);
      const [recordsRes, summaryRes] = await Promise.all([
        api.getComplianceRecords({ year: parseInt(filterYear) }),
        api.getComplianceSummary(),
      ]);
      
      if (recordsRes.error) throw recordsRes.error;
      
      const allRecordsData = recordsRes.data || [];
      setAllRecords(allRecordsData);
      
      const filteredRecords = allRecordsData.filter(
        (r: ComplianceRecord) => r.cooperative_id === selectedCooperative.id
      );
      setRecords(filteredRecords);
      setSummary(summaryRes.data || null);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCooperativeComplianceSummary = (coopId: string): CooperativeComplianceSummary => {
    const coopRecords = allRecords.filter(r => r.cooperative_id === coopId);
    return {
      total: coopRecords.length,
      compliant: coopRecords.filter(r => r.status === 'compliant').length,
      pending: coopRecords.filter(r => r.status === 'pending').length,
      overdue: coopRecords.filter(r => r.status === 'overdue').length,
      submitted: coopRecords.filter(r => r.status === 'submitted').length,
      non_compliant: coopRecords.filter(r => r.status === 'non_compliant').length,
    };
  };

  const filteredCooperatives = useMemo(() => {
    if (!coopSearchTerm) return cooperatives;
    const search = coopSearchTerm.toLowerCase();
    return cooperatives.filter(coop => 
      coop.name.toLowerCase().includes(search) ||
      coop.coop_id.toLowerCase().includes(search)
    );
  }, [cooperatives, coopSearchTerm]);

  const handleSelectCooperative = (coop: Cooperative) => {
    setSelectedCooperative(coop);
    setFormData(prev => ({ ...prev, cooperative_id: coop.id }));
  };

  const handleBackToCooperatives = () => {
    setSelectedCooperative(null);
    setSearchTerm('');
  };

  const handleCreateRecord = async () => {
    const coopId = selectedCooperative ? selectedCooperative.id : formData.cooperative_id;
    if (!coopId || !formData.requirement_type || !formData.requirement_name) {
      toast({
        title: 'Validation Error',
        description: 'Cooperative, requirement type, and name are required',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await api.createComplianceRecord({
        ...formData,
        cooperative_id: coopId,
      });
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Compliance requirement created successfully',
      });
      setShowCreateDialog(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      console.error('Error creating record:', error);
      toast({
        title: 'Error',
        description: 'Failed to create compliance requirement',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: 'compliant' | 'non_compliant' | 'submitted') => {
    if (!selectedRecord) return;

    setSubmitting(true);
    try {
      const { error } = await api.updateComplianceStatus(selectedRecord.id, {
        status,
        reviewer_notes: reviewNotes,
        reviewed_by: '11111111-1111-1111-1111-111111111111',
        submitted_date: status === 'submitted' ? new Date().toISOString().split('T')[0] : undefined,
      });
      if (error) throw error;

      toast({
        title: 'Success',
        description: `Status updated to ${status.replace('_', ' ')}`,
      });
      setShowReviewDialog(false);
      setReviewNotes('');
      fetchRecords();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this compliance record?')) return;

    try {
      const { error } = await api.deleteComplianceRecord(id);
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Record deleted successfully',
      });
      fetchRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete record',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      cooperative_id: selectedCooperative ? selectedCooperative.id : '',
      requirement_type: '',
      requirement_name: '',
      description: '',
      due_date: '',
      year: new Date().getFullYear(),
    });
  };

  const toggleSection = (status: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const filteredRecords = records.filter(record => {
    const search = searchTerm.toLowerCase();
    return record.cooperative_name?.toLowerCase().includes(search) ||
      record.requirement_name?.toLowerCase().includes(search) ||
      record.requirement_type?.toLowerCase().includes(search);
  });

  const groupedRecords = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = filteredRecords.filter(r => r.status === status);
    return acc;
  }, {} as Record<string, ComplianceRecord[]>);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getComplianceRate = () => {
    if (!selectedCooperative) {
      if (!summary) return 0;
      const total = parseInt(summary.total) || 0;
      const compliant = parseInt(summary.compliant) || 0;
      if (total === 0) return 0;
      return Math.round((compliant / total) * 100);
    }
    const coopSummary = getCooperativeComplianceSummary(selectedCooperative.id);
    if (coopSummary.total === 0) return 0;
    return Math.round((coopSummary.compliant / coopSummary.total) * 100);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const renderCooperativeSelection = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Select a Cooperative
        </h2>
        <p className="text-muted-foreground">
          Choose a cooperative to view and manage their compliance records
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search cooperatives by name or ID..."
            value={coopSearchTerm}
            onChange={(e) => setCoopSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-coop-search"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filteredCooperatives.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No cooperatives found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCooperatives.map(coop => {
            const complianceSummary = getCooperativeComplianceSummary(coop.id);
            const complianceRate = complianceSummary.total > 0 
              ? Math.round((complianceSummary.compliant / complianceSummary.total) * 100) 
              : 0;
            
            return (
              <Card 
                key={coop.id} 
                className="glass-card cursor-pointer hover-elevate active-elevate-2 overflow-visible"
                onClick={() => handleSelectCooperative(coop)}
                data-testid={`card-cooperative-${coop.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <Badge variant="outline">{coop.coop_id}</Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{coop.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Compliance Rate</span>
                    <span className="font-medium">{complianceRate}%</span>
                  </div>
                  <Progress value={complianceRate} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground">
                        {complianceSummary.compliant} Compliant
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span className="text-xs text-muted-foreground">
                        {complianceSummary.pending} Pending
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-xs text-muted-foreground">
                        {complianceSummary.overdue} Overdue
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs text-muted-foreground">
                        {complianceSummary.submitted} Submitted
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderComplianceManagement = () => {
    const coopSummary = selectedCooperative 
      ? getCooperativeComplianceSummary(selectedCooperative.id) 
      : null;

    return (
      <div className="p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackToCooperatives}
            className="mb-4"
            data-testid="button-back-cooperatives"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cooperatives
          </Button>
        </div>

        {coopSummary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{coopSummary.total}</div>
                <p className="text-sm text-gray-500">Total Requirements</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{coopSummary.compliant}</div>
                <p className="text-sm text-gray-500">Compliant</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-yellow-600">{coopSummary.pending}</div>
                <p className="text-sm text-gray-500">Pending</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-600">{coopSummary.overdue}</div>
                <p className="text-sm text-gray-500">Overdue</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{getComplianceRate()}%</div>
                <Progress value={getComplianceRate()} className="mt-2" />
                <p className="text-sm text-gray-500 mt-1">Compliance Rate</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Compliance Records
          </h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-32" data-testid="select-year">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search"
              />
            </div>
            {userRole === 'administrator' && (
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create">
                <Plus className="h-4 w-4 mr-2" />
                Add Requirement
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {STATUS_ORDER.map(status => {
              const config = STATUS_CONFIG[status];
              const StatusIcon = config.icon;
              const items = groupedRecords[status] || [];

              return (
                <Collapsible
                  key={status}
                  open={expandedSections[status]}
                  onOpenChange={() => toggleSection(status)}
                >
                  <Card className={config.bgColor}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className={`cursor-pointer ${config.headerColor} rounded-t-lg`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <StatusIcon className="h-5 w-5" />
                            <div>
                              <CardTitle className="text-lg">{config.label}</CardTitle>
                              <CardDescription>{config.description}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{items.length} records</Badge>
                            <ChevronDown className={`h-5 w-5 transition-transform ${expandedSections[status] ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-4">
                        {items.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No records in this category</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map(record => (
                              <Card key={record.id} className="bg-white dark:bg-gray-800">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <Badge className={config.badgeClass}>{status.replace('_', ' ')}</Badge>
                                    <span className="text-xs text-gray-500">{record.requirement_type}</span>
                                  </div>
                                  <CardTitle className="text-base mt-2">{record.requirement_name}</CardTitle>
                                  <CardDescription>{record.cooperative_name || 'Unknown Cooperative'}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                  {record.description && (
                                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                                      {record.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Calendar className="h-4 w-4" />
                                    <span>Due: {formatDate(record.due_date)}</span>
                                  </div>
                                  {record.submitted_date && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                      <FileText className="h-4 w-4" />
                                      <span>Submitted: {formatDate(record.submitted_date)}</span>
                                    </div>
                                  )}
                                  <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedRecord(record);
                                        setShowViewDialog(true);
                                      }}
                                      data-testid={`button-view-${record.id}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {userRole === 'administrator' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedRecord(record);
                                            setShowReviewDialog(true);
                                          }}
                                          data-testid={`button-review-${record.id}`}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-red-600"
                                          onClick={() => handleDeleteRecord(record.id)}
                                          data-testid={`button-delete-${record.id}`}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout
      title={selectedCooperative ? `Compliance: ${selectedCooperative.name}` : "Regulatory Compliance"}
      description={selectedCooperative 
        ? `Managing compliance records for ${selectedCooperative.name} (${selectedCooperative.coop_id})`
        : "Select a cooperative to manage compliance records"
      }
    >
      {selectedCooperative ? renderComplianceManagement() : renderCooperativeSelection()}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Compliance Requirement</DialogTitle>
            <DialogDescription>
              {selectedCooperative 
                ? `Create a new compliance requirement for ${selectedCooperative.name}`
                : 'Create a new compliance requirement for a cooperative'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCooperative ? (
              <div>
                <Label>Cooperative</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedCooperative.name}</span>
                  <Badge variant="outline">{selectedCooperative.coop_id}</Badge>
                </div>
              </div>
            ) : (
              <div>
                <Label>Cooperative *</Label>
                <Select
                  value={formData.cooperative_id}
                  onValueChange={(value) => setFormData({ ...formData, cooperative_id: value })}
                >
                  <SelectTrigger data-testid="select-cooperative">
                    <SelectValue placeholder="Select cooperative" />
                  </SelectTrigger>
                  <SelectContent>
                    {cooperatives.map(coop => (
                      <SelectItem key={coop.id} value={coop.id}>{coop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Requirement Type *</Label>
              <Select
                value={formData.requirement_type}
                onValueChange={(value) => setFormData({ ...formData, requirement_type: value })}
              >
                <SelectTrigger data-testid="select-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {REQUIREMENT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Requirement Name *</Label>
              <Input
                value={formData.requirement_name}
                onChange={(e) => setFormData({ ...formData, requirement_name: e.target.value })}
                placeholder="e.g., 2024 Annual Financial Statement"
                data-testid="input-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details..."
                data-testid="input-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  data-testid="input-due-date"
                />
              </div>
              <div>
                <Label>Year</Label>
                <Select
                  value={formData.year.toString()}
                  onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                >
                  <SelectTrigger data-testid="select-year-form">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateRecord} disabled={submitting} data-testid="button-submit">
              {submitting ? 'Creating...' : 'Create Requirement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Compliance Record Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">Requirement</Label>
                <p className="font-medium">{selectedRecord.requirement_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Cooperative</Label>
                  <p>{selectedRecord.cooperative_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Type</Label>
                  <p>{selectedRecord.requirement_type}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Due Date</Label>
                  <p>{formatDate(selectedRecord.due_date)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Submitted</Label>
                  <p>{formatDate(selectedRecord.submitted_date)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Year</Label>
                  <p>{selectedRecord.year}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <Badge className={STATUS_CONFIG[selectedRecord.status as keyof typeof STATUS_CONFIG]?.badgeClass || ''}>
                    {selectedRecord.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              {selectedRecord.description && (
                <div>
                  <Label className="text-gray-500">Description</Label>
                  <p>{selectedRecord.description}</p>
                </div>
              )}
              {selectedRecord.reviewer_notes && (
                <div>
                  <Label className="text-gray-500">Reviewer Notes</Label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {selectedRecord.reviewer_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Compliance Status</DialogTitle>
            <DialogDescription>
              Update the status of this compliance requirement
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">Requirement</Label>
                <p className="font-medium">{selectedRecord.requirement_name}</p>
                <p className="text-sm text-gray-500">{selectedRecord.cooperative_name}</p>
              </div>
              <div>
                <Label>Review Notes</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this record..."
                  data-testid="input-review-notes"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
            <Button
              variant="outline"
              className="text-blue-600"
              onClick={() => handleUpdateStatus('submitted')}
              disabled={submitting}
              data-testid="button-submitted"
            >
              Mark Submitted
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleUpdateStatus('non_compliant')}
              disabled={submitting}
              data-testid="button-non-compliant"
            >
              Non-Compliant
            </Button>
            <Button
              onClick={() => handleUpdateStatus('compliant')}
              disabled={submitting}
              data-testid="button-compliant"
            >
              Mark Compliant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default RegulatoryCompliance;
