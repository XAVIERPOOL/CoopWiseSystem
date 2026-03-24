import { useState, useEffect } from 'react';
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
  Building2,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Phone,
  FileText,
  Check,
  X,
  Users,
  Layers,
  CalendarDays,
  Mail
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';

interface Cooperative {
  id: string;
  coop_id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  province: string;
  region: string;
  registration_number: string;
  cda_registration_date: string;
  tin: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  submitted_documents: any[];
  review_notes: string;
  created_at: string;
}

const STATUS_ORDER = ['pending', 'needs_resubmission', 'approved', 'rejected'] as const;

const STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    description: 'Applications awaiting review',
    icon: Clock,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    headerColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  needs_resubmission: {
    label: 'Needs Resubmission',
    description: 'Applications requiring additional documents',
    icon: AlertCircle,
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    headerColor: 'bg-orange-100 dark:bg-orange-900/30',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  approved: {
    label: 'Approved',
    description: 'Successfully registered cooperatives',
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    headerColor: 'bg-green-100 dark:bg-green-900/30',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  rejected: {
    label: 'Rejected',
    description: 'Declined applications',
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    headerColor: 'bg-red-100 dark:bg-red-900/30',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
};

const COOPERATIVE_TYPES = [
  'Credit Cooperative',
  'Consumer Cooperative',
  'Producers Cooperative',
  'Marketing Cooperative',
  'Service Cooperative',
  'Multi-Purpose Cooperative',
  'Agrarian Reform Cooperative',
  'Cooperative Bank',
  'Dairy Cooperative',
  'Fishermen Cooperative',
  'Electric Cooperative',
  'Water Service Cooperative',
  'Transport Cooperative',
  'Housing Cooperative',
  'Healthcare Cooperative',
  'Other'
];

const CooperativeRegistration = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'officer';
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  
  // File upload states for Step 4
  const [documents, setDocuments] = useState({
    cda_certificate: null as File | null,
    articles_of_cooperation: null as File | null,
    valid_id: null as File | null,
    mayors_permit: null as File | null,
    capr: null as File | null,
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedCooperative, setSelectedCooperative] = useState<Cooperative | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const stepTitles = [
    'Basic Information',
    'Legal & Registration Details',
    'Contact Information',
    'Document Uploads'
  ];

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    address: '',
    city: 'Naga City',
    province: 'Camarines Sur',
    region: 'Region V (Bicol)',
    registration_number: '',
    cda_registration_date: '',
    tin: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
  });

  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchCooperatives();
  }, []);

  const fetchCooperatives = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.getCooperatives();
      if (error) throw error;
      setCooperatives(data || []);
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

  // Helper: reads a File and returns its base64 data URL so we can store and re-open it
  const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleCreateCooperative = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Cooperative name is required',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Convert each selected file to a base64 data URL so it can be stored and later opened in a new tab
      const docEntries = [
        { key: 'cda_certificate',       label: 'CDA Certificate',        file: documents.cda_certificate },
        { key: 'articles_of_cooperation', label: 'Articles of Cooperation', file: documents.articles_of_cooperation },
        { key: 'valid_id',              label: 'Valid ID',                file: documents.valid_id },
        { key: 'mayors_permit',         label: 'Mayor\'s Permit',         file: documents.mayors_permit },
        { key: 'capr',                  label: 'CAPR',                    file: documents.capr },
      ];

      const submittedDocuments = await Promise.all(
        docEntries
          .filter(d => d.file !== null)
          .map(async d => ({
            type: d.key,
            label: d.label,
            filename: d.file!.name,
            size: d.file!.size,
            mime_type: d.file!.type,
            data_url: await readFileAsDataURL(d.file!),
            uploaded_at: new Date().toISOString(),
          }))
      );

      const { data, error } = await api.createCooperative({
        ...formData,
        submitted_documents: submittedDocuments,
      } as any);
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Cooperative registration submitted successfully',
      });
      setShowCreateDialog(false);
      resetForm();
      fetchCooperatives();
    } catch (error) {
      console.error('Error creating cooperative:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit registration',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: 'approved' | 'rejected' | 'needs_resubmission') => {
    if (!selectedCooperative) return;

    setSubmitting(true);
    try {
      // Get the actual logged-in user's ID
      const currentUserId = localStorage.getItem('userId');

      const { error } = await api.updateCooperativeStatus(selectedCooperative.id, {
        status,
        review_notes: reviewNotes,
        reviewed_by: currentUserId, // Now sends the correct ID to the backend
      });
      if (error) throw error;

      toast({
        title: 'Success',
        description: `Cooperative ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'marked for resubmission'}`,
      });
      setShowReviewDialog(false);
      setReviewNotes('');
      fetchCooperatives();
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

  const handleDeleteCooperative = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cooperative registration?')) return;

    try {
      const { error } = await api.deleteCooperative(id);
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Cooperative deleted successfully',
      });
      fetchCooperatives();
    } catch (error) {
      console.error('Error deleting cooperative:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete cooperative',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      address: '',
      city: 'Naga City',
      province: 'Camarines Sur',
      region: 'Region V (Bicol)',
      registration_number: '',
      cda_registration_date: '',
      tin: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
    });
    setDocuments({
      cda_certificate: null,
      articles_of_cooperation: null,
      valid_id: null,
      mayors_permit: null,
      capr: null,
    });
    setCurrentStep(1);
    setStepErrors({});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments({ ...documents, [field]: e.target.files[0] });
    }
  };

  const removeFile = (field: string) => {
    setDocuments({ ...documents, [field]: null });
  };

  const clearError = (field: string) => {
    if (stepErrors[field]) setStepErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.name.trim()) errors.name = 'Cooperative name is required';
      if (!formData.type) errors.type = 'Please select a cooperative type';
      if (!formData.address.trim()) errors.address = 'Street address is required';
    }
    if (step === 2) {
      if (!formData.registration_number.trim()) errors.registration_number = 'CDA Registration Number is required';
      if (!formData.tin.trim()) errors.tin = 'TIN is required';
    }
    if (step === 3) {
      if (!formData.contact_person.trim()) errors.contact_person = 'Contact person name is required';
      if (!formData.contact_email.trim()) errors.contact_email = 'Email address is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) errors.contact_email = 'Enter a valid email address';
      if (!formData.contact_phone.trim()) errors.contact_phone = 'Phone number is required';
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const filteredCooperatives = cooperatives.filter(coop =>
    coop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coop.coop_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coop.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedCooperatives = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = filteredCooperatives.filter(c => c.status === status);
    return acc;
  }, {} as Record<string, Cooperative[]>);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout
      title="Cooperative Registration"
      description="Register and manage cooperative organizations"
    >
      <div className="p-6 space-y-6">
        {/* ── Header Banner ── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e293b] via-[#1e3a5f] to-[#164e8e] text-white shadow-lg p-6">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 0%, transparent 60%)' }} />
          <div className="relative z-10 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20 shadow-inner">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Cooperative Applications</h2>
                <p className="text-blue-200/80 text-sm font-medium mt-0.5">Naga City · Camarines Sur · Region V</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search cooperatives..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-56 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus-visible:ring-white/30"
                  data-testid="input-search"
                />
              </div>
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create" className="bg-white text-[#1e293b] hover:bg-blue-50 font-bold shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                New Registration
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {STATUS_ORDER.map(status => {
              const cfg = STATUS_CONFIG[status];
              const count = groupedCooperatives[status]?.length || 0;
              const StatIcon = cfg.icon;
              return (
                <button
                  key={status}
                  onClick={() => setActiveTab(status)}
                  className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                    activeTab === status
                    ? 'bg-white/20 border-white/40 shadow-inner'
                    : 'bg-white/10 border-white/10 hover:bg-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <StatIcon className="h-4 w-4 text-white/70" />
                    <span className="text-2xl font-extrabold text-white">{count}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider truncate">{cfg.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pill Tabs */}
            <div className="bg-white border border-gray-200 p-1.5 rounded-xl shadow-sm flex gap-1 overflow-x-auto">
              {STATUS_ORDER.map(status => {
                const config = STATUS_CONFIG[status];
                const count = groupedCooperatives[status]?.length || 0;
                const isActive = activeTab === status;
                const TabIcon = config.icon;
                return (
                  <button
                    key={status}
                    onClick={() => setActiveTab(status)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 min-w-max
                      ${isActive 
                        ? 'bg-[#1e293b] text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                  >
                    <TabIcon className={`h-4 w-4 ${isActive ? 'text-white/80' : 'text-gray-400'}`} />
                    {config.label}
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div>
              {(groupedCooperatives[activeTab] || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  {(() => { const Icon = STATUS_CONFIG[activeTab as keyof typeof STATUS_CONFIG].icon; return <Icon className="h-12 w-12 text-gray-300 mb-4" />; })()}
                  <p className="text-gray-500 font-semibold text-lg">No applications here</p>
                  <p className="text-gray-400 text-sm mt-1">{STATUS_CONFIG[activeTab as keyof typeof STATUS_CONFIG].description}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(groupedCooperatives[activeTab] || []).map(coop => {
                    const config = STATUS_CONFIG[activeTab as keyof typeof STATUS_CONFIG];
                    const borderAccent = {
                      pending: 'border-l-yellow-400',
                      needs_resubmission: 'border-l-orange-400',
                      approved: 'border-l-green-500',
                      rejected: 'border-l-red-400',
                    }[activeTab] ?? 'border-l-gray-300';
                    return (
                      <Card key={coop.id} className={`bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 border-l-4 ${borderAccent} group`}>
                        <CardHeader className="pb-2 pt-4 px-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-gray-100 rounded-lg p-2 shrink-0 group-hover:bg-blue-50 transition-colors">
                              <Building2 className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <Badge className={`${config.badgeClass} text-[10px] px-2 py-0.5 capitalize`}>{activeTab.replace('_', ' ')}</Badge>
                                <span className="text-[10px] text-gray-400 font-medium shrink-0">{coop.coop_id}</span>
                              </div>
                              <CardTitle className="text-[15px] leading-snug font-bold truncate">{coop.name}</CardTitle>
                              <CardDescription className="text-xs mt-0.5 truncate">{coop.type || 'N/A'}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-2 text-xs text-gray-500">
                          <div className="h-px bg-gray-100 my-2" />
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{coop.city || 'N/A'}, {coop.province || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span>{coop.contact_phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span>Submitted {formatDate(coop.created_at)}</span>
                          </div>
                          <div className="flex gap-2 pt-3 border-t border-gray-100">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-gray-700 font-semibold h-8 text-xs hover:bg-gray-50"
                              onClick={() => { setSelectedCooperative(coop); setShowViewDialog(true); }}
                              data-testid={`button-view-${coop.id}`}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Details
                            </Button>
                            {userRole === 'administrator' && activeTab === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 font-semibold h-8 text-xs"
                                onClick={() => { setSelectedCooperative(coop); setShowReviewDialog(true); }}
                                data-testid={`button-review-${coop.id}`}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" /> Review
                              </Button>
                            )}
                            {userRole === 'administrator' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:bg-red-50 hover:text-red-600 w-8 h-8 p-0"
                                onClick={() => handleDeleteCooperative(coop.id)}
                                data-testid={`button-delete-${coop.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) setTimeout(resetForm, 300);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Register New Cooperative</DialogTitle>
            <DialogDescription className="text-gray-500 font-medium pb-2">
              Step {currentStep} of 4: {stepTitles[currentStep - 1]}
            </DialogDescription>
          </DialogHeader>

          <div className="mb-6 mt-2 hidden sm:block">
            <div className="flex items-center justify-between relative z-0 mx-4">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-[2px] bg-gray-200 -z-10"></div>
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-[2px] bg-blue-600 -z-10 transition-all duration-300" style={{ width: `${((currentStep - 1) / 3) * 100}%` }}></div>
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${
                    step < currentStep
                      ? 'bg-blue-600 text-white border-2 border-blue-600'
                      : step === currentStep
                      ? 'bg-blue-600 text-white shadow-[0_0_0_4px_rgba(255,255,255,1),0_0_0_6px_rgba(37,99,235,1)]'
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}
                >
                  {step < currentStep ? <Check className="h-4 w-4" /> : step}
                </div>
              ))}
            </div>
          </div>

          <div className="py-2 min-h-[300px]">
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <Label className="text-gray-700 font-semibold mb-1 block">Cooperative Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); clearError('name'); }}
                    placeholder="Enter cooperative name"
                    data-testid="input-name"
                    className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${stepErrors.name ? 'border-red-400 focus:border-red-400' : ''}`}
                  />
                  {stepErrors.name && <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><X className="h-3 w-3" />{stepErrors.name}</p>}
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold mb-1 block">Cooperative Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => { setFormData({ ...formData, type: value }); clearError('type'); }}
                  >
                    <SelectTrigger data-testid="select-type" className={`h-11 border-gray-300 ${stepErrors.type ? 'border-red-400' : ''}`}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COOPERATIVE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {stepErrors.type && <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><X className="h-3 w-3" />{stepErrors.type}</p>}
                </div>
                
                <div className="pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">LOCATION DETAILS</h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700 font-semibold mb-1 block">Street Address <span className="text-red-500">*</span></Label>
                      <Textarea
                        value={formData.address}
                        onChange={(e) => { setFormData({ ...formData, address: e.target.value }); clearError('address'); }}
                        placeholder="Complete street address"
                        data-testid="input-address"
                        className={`resize-none h-20 border-gray-300 ${stepErrors.address ? 'border-red-400' : ''}`}
                      />
                      {stepErrors.address && <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><X className="h-3 w-3" />{stepErrors.address}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700 font-semibold mb-1 block">City</Label>
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          data-testid="input-city"
                          className="h-11 bg-white border-gray-300"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 font-semibold mb-1 block">Province</Label>
                        <Input
                          value={formData.province}
                          onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                          data-testid="input-province"
                          className="h-11 bg-white border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 font-semibold mb-1 block">CDA Registration Number <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.registration_number}
                      onChange={(e) => { setFormData({ ...formData, registration_number: e.target.value }); clearError('registration_number'); }}
                      placeholder="e.g., 9520-15000123"
                      data-testid="input-registration-number"
                      className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${stepErrors.registration_number ? 'border-red-400' : ''}`}
                    />
                    {stepErrors.registration_number && <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><X className="h-3 w-3" />{stepErrors.registration_number}</p>}
                  </div>
                  <div>
                    <Label className="text-gray-700 font-semibold mb-1 block">CDA Registration Date</Label>
                    <Input
                      type="date"
                      value={formData.cda_registration_date}
                      onChange={(e) => setFormData({ ...formData, cda_registration_date: e.target.value })}
                      data-testid="input-cda-date"
                      className="h-11 border-gray-300"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold mb-1 block">TIN (Tax Identification Number) <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.tin}
                    onChange={(e) => { setFormData({ ...formData, tin: e.target.value }); clearError('tin'); }}
                    placeholder="XXX-XXX-XXX-XXX"
                    data-testid="input-tin"
                    className={`h-11 border-gray-300 ${stepErrors.tin ? 'border-red-400' : ''}`}
                  />
                  {stepErrors.tin && <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><X className="h-3 w-3" />{stepErrors.tin}</p>}
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">Format: 12-digit number separated by dashes.</p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <Label className="text-gray-700 font-semibold mb-1 block">Primary Contact Person <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.contact_person}
                    onChange={(e) => { setFormData({ ...formData, contact_person: e.target.value }); clearError('contact_person'); }}
                    placeholder="Mark Vincent"
                    data-testid="input-contact-person"
                    className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${stepErrors.contact_person ? 'border-red-400' : ''}`}
                  />
                  {stepErrors.contact_person && <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><X className="h-3 w-3" />{stepErrors.contact_person}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 font-semibold mb-1 block">Contact Email <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => { setFormData({ ...formData, contact_email: e.target.value }); clearError('contact_email'); }}
                      placeholder="mari@gmail.com"
                      data-testid="input-contact-email"
                      className={`h-11 border-gray-300 ${stepErrors.contact_email ? 'border-red-400' : ''}`}
                    />
                    {stepErrors.contact_email && <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><X className="h-3 w-3" />{stepErrors.contact_email}</p>}
                  </div>
                  <div>
                    <Label className="text-gray-700 font-semibold mb-1 block">Contact Phone <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => { setFormData({ ...formData, contact_phone: e.target.value }); clearError('contact_phone'); }}
                      placeholder="+63 XXX XXX XXXX"
                      data-testid="input-contact-phone"
                      className={`h-11 border-gray-300 ${stepErrors.contact_phone ? 'border-red-400' : ''}`}
                    />
                    {stepErrors.contact_phone && <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><X className="h-3 w-3" />{stepErrors.contact_phone}</p>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-[#eff6ff] border border-blue-100 p-4 rounded-xl flex gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-0.5">Required Documents</h4>
                    <p className="text-blue-700/80 leading-relaxed text-xs">Please upload the specific documents requested below. All fields are required for a complete application.</p>
                  </div>
                </div>
                
                <div className="border border-gray-200/60 shadow-sm rounded-xl p-4 bg-white transition-all hover:border-gray-300">
                   <div className="mb-3">
                     <h4 className="font-bold text-gray-900 text-[13px] tracking-wide">1. CDA Registration Certificate <span className="text-red-500">*</span></h4>
                     <p className="text-xs text-gray-500 mt-1 font-medium">Scanned copy of your official registration from the Cooperative Development Authority.</p>
                   </div>
                   <div className="flex flex-wrap items-center gap-3">
                     <div className="relative">
                       <input 
                         type="file" 
                         id="doc-cda" 
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         onChange={(e) => handleFileChange(e, 'cda_certificate')}
                         accept=".pdf,.jpg,.jpeg,.png"
                       />
                       <Button variant="outline" size="sm" type="button" className="bg-white h-8 text-xs font-semibold px-4 rounded-lg border-gray-300 shadow-sm pointer-events-none">
                         {documents.cda_certificate ? 'Change File' : 'Upload File'}
                       </Button>
                     </div>
                     {documents.cda_certificate && (
                       <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50/80 px-3 pr-2 py-1.5 rounded-lg border border-gray-200 animate-in fade-in zoom-in duration-200">
                         <FileText className="w-3.5 h-3.5 text-blue-500/80" />
                         <span className="truncate max-w-[150px] md:max-w-[200px]">{documents.cda_certificate.name}</span>
                         <button type="button" onClick={() => removeFile('cda_certificate')} className="outline-none focus:outline-none ml-1">
                           <X className="w-3.5 h-3.5 text-red-500/80 hover:text-red-600 transition-colors" />
                         </button>
                       </div>
                     )}
                   </div>
                </div>
                
                <div className="border border-gray-200/60 shadow-sm rounded-xl p-4 bg-white transition-all hover:border-gray-300">
                   <div className="mb-3">
                     <h4 className="font-bold text-gray-900 text-[13px] tracking-wide">2. Articles of Cooperation and By-Laws <span className="text-red-500">*</span></h4>
                     <p className="text-xs text-gray-500 mt-1 font-medium">The complete set of your approved cooperative by-laws.</p>
                   </div>
                   <div className="flex flex-wrap items-center gap-3">
                     <div className="relative">
                       <input 
                         type="file" 
                         id="doc-articles" 
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         onChange={(e) => handleFileChange(e, 'articles_of_cooperation')}
                         accept=".pdf,.doc,.docx"
                       />
                       <Button variant="outline" size="sm" type="button" className="bg-white h-8 text-xs font-semibold px-4 rounded-lg border-gray-300 shadow-sm pointer-events-none">
                         {documents.articles_of_cooperation ? 'Change File' : 'Upload File'}
                       </Button>
                     </div>
                     {documents.articles_of_cooperation && (
                       <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50/80 px-3 pr-2 py-1.5 rounded-lg border border-gray-200 animate-in fade-in zoom-in duration-200">
                         <FileText className="w-3.5 h-3.5 text-orange-500/80" />
                         <span className="truncate max-w-[150px] md:max-w-[200px]">{documents.articles_of_cooperation.name}</span>
                         <button type="button" onClick={() => removeFile('articles_of_cooperation')} className="outline-none focus:outline-none ml-1">
                           <X className="w-3.5 h-3.5 text-red-500/80 hover:text-red-600 transition-colors" />
                         </button>
                       </div>
                     )}
                   </div>
                </div>

                <div className="border border-gray-200/60 shadow-sm rounded-xl p-4 bg-white transition-all hover:border-gray-300">
                   <div className="mb-3">
                     <h4 className="font-bold text-gray-900 text-[13px] tracking-wide">3. Valid ID of Primary Contact Person <span className="text-red-500">*</span></h4>
                     <p className="text-xs text-gray-500 mt-1 font-medium">A clear scan of a government-issued ID for the representative.</p>
                   </div>
                   <div className="flex flex-wrap items-center gap-3">
                     <div className="relative">
                       <input 
                         type="file" 
                         id="doc-id" 
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         onChange={(e) => handleFileChange(e, 'valid_id')}
                         accept=".pdf,.jpg,.jpeg,.png"
                       />
                       <Button variant="outline" size="sm" type="button" className="bg-white h-8 text-xs font-semibold px-4 rounded-lg border-gray-300 shadow-sm pointer-events-none">
                         {documents.valid_id ? 'Change File' : 'Upload File'}
                       </Button>
                     </div>
                     {documents.valid_id && (
                       <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50/80 px-3 pr-2 py-1.5 rounded-lg border border-gray-200 animate-in fade-in zoom-in duration-200">
                         <FileText className="w-3.5 h-3.5 text-green-500/80" />
                         <span className="truncate max-w-[150px] md:max-w-[200px]">{documents.valid_id.name}</span>
                         <button type="button" onClick={() => removeFile('valid_id')} className="outline-none focus:outline-none ml-1">
                           <X className="w-3.5 h-3.5 text-red-500/80 hover:text-red-600 transition-colors" />
                         </button>
                       </div>
                     )}
                   </div>
                </div>

                <div className="border border-gray-200/60 shadow-sm rounded-xl p-4 bg-white transition-all hover:border-gray-300">
                   <div className="mb-3">
                     <h4 className="font-bold text-gray-900 text-[13px] tracking-wide">4. Mayor's Permit <span className="text-red-500">*</span></h4>
                     <p className="text-xs text-gray-500 mt-1 font-medium">Clear scanned copy of your organization's recent Mayor's Permit or Business Permit.</p>
                   </div>
                   <div className="flex flex-wrap items-center gap-3">
                     <div className="relative">
                       <input 
                         type="file" 
                         id="doc-mayor" 
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         onChange={(e) => handleFileChange(e, 'mayors_permit')}
                         accept=".pdf,.jpg,.jpeg,.png"
                       />
                       <Button variant="outline" size="sm" type="button" className="bg-white h-8 text-xs font-semibold px-4 rounded-lg border-gray-300 shadow-sm pointer-events-none">
                         {documents.mayors_permit ? 'Change File' : 'Upload File'}
                       </Button>
                     </div>
                     {documents.mayors_permit && (
                       <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50/80 px-3 pr-2 py-1.5 rounded-lg border border-gray-200 animate-in fade-in zoom-in duration-200">
                         <FileText className="w-3.5 h-3.5 text-blue-500/80" />
                         <span className="truncate max-w-[150px] md:max-w-[200px]">{documents.mayors_permit.name}</span>
                         <button type="button" onClick={() => removeFile('mayors_permit')} className="outline-none focus:outline-none ml-1">
                           <X className="w-3.5 h-3.5 text-red-500/80 hover:text-red-600 transition-colors" />
                         </button>
                       </div>
                     )}
                   </div>
                </div>

                <div className="border border-gray-200/60 shadow-sm rounded-xl p-4 bg-white transition-all hover:border-gray-300">
                   <div className="mb-3">
                     <h4 className="font-bold text-gray-900 text-[13px] tracking-wide">5. CAPR (Cooperative Annual Progress Report) <span className="text-red-500">*</span></h4>
                     <p className="text-xs text-gray-500 mt-1 font-medium">Annual report documentation verifying institutional compliance standing.</p>
                   </div>
                   <div className="flex flex-wrap items-center gap-3">
                     <div className="relative">
                       <input 
                         type="file" 
                         id="doc-capr" 
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         onChange={(e) => handleFileChange(e, 'capr')}
                         accept=".pdf,.doc,.docx"
                       />
                       <Button variant="outline" size="sm" type="button" className="bg-white h-8 text-xs font-semibold px-4 rounded-lg border-gray-300 shadow-sm pointer-events-none">
                         {documents.capr ? 'Change File' : 'Upload File'}
                       </Button>
                     </div>
                     {documents.capr && (
                       <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50/80 px-3 pr-2 py-1.5 rounded-lg border border-gray-200 animate-in fade-in zoom-in duration-200">
                         <FileText className="w-3.5 h-3.5 text-orange-500/80" />
                         <span className="truncate max-w-[150px] md:max-w-[200px]">{documents.capr.name}</span>
                         <button type="button" onClick={() => removeFile('capr')} className="outline-none focus:outline-none ml-1">
                           <X className="w-3.5 h-3.5 text-red-500/80 hover:text-red-600 transition-colors" />
                         </button>
                       </div>
                     )}
                   </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-between sm:justify-between items-center w-full pt-4 mt-2 grid-cols-2">
            {currentStep === 1 ? (
              <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-gray-500 hover:text-gray-800 font-semibold h-11 px-6 rounded-full border border-gray-200 hover:bg-gray-50">Cancel</Button>
            ) : (
            <Button variant="ghost" onClick={() => { setCurrentStep(prev => prev - 1); setStepErrors({}); }} className="text-gray-500 hover:text-gray-800 font-semibold h-11 px-6 rounded-full border border-gray-200 hover:bg-gray-50">Back</Button>
            )}
            
            <div className="flex gap-2 justify-end w-full sm:w-auto ml-auto">
              {currentStep < 4 ? (
                <Button onClick={handleNextStep} className="bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-md transition-all font-semibold h-11 px-6 rounded-full">
                  Next Step
                </Button>
              ) : (
                <Button onClick={handleCreateCooperative} disabled={submitting} className="bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-md transition-all font-semibold h-11 px-6 rounded-full">
                  {submitting ? 'Submitting...' : 'Submit Registration'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {selectedCooperative && (
            <>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#1e293b] to-[#1e3a5f] text-white p-6 rounded-t-lg">
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/20">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-extrabold leading-tight">{selectedCooperative.name}</h2>
                    <p className="text-blue-200/80 text-sm font-medium mt-0.5">{selectedCooperative.type || 'N/A'} · ID: {selectedCooperative.coop_id}</p>
                    <div className="mt-2">
                      {(() => {
                        const cfg = STATUS_CONFIG[selectedCooperative.status as keyof typeof STATUS_CONFIG];
                        if (!cfg) return null;
                        return <Badge className={`${cfg.badgeClass} capitalize`}>{selectedCooperative.status?.replace('_', ' ')}</Badge>;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">CDA Reg. Number</Label>
                    <p className="font-semibold text-gray-800">{selectedCooperative.registration_number || 'N/A'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">TIN</Label>
                    <p className="font-semibold text-gray-800">{selectedCooperative.tin || 'N/A'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Date Submitted</Label>
                    <p className="font-semibold text-gray-800">{formatDate(selectedCooperative.created_at)}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-2 mb-2"><MapPin className="h-3.5 w-3.5" /> Address</Label>
                  <p className="font-semibold text-gray-800">{selectedCooperative.address || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{selectedCooperative.city}, {selectedCooperative.province}, {selectedCooperative.region}</p>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1.5"><Users className="h-3.5 w-3.5" /> Contact Person</Label>
                    <p className="font-semibold text-sm text-gray-800">{selectedCooperative.contact_person || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1.5"><Phone className="h-3.5 w-3.5" /> Phone</Label>
                    <p className="font-semibold text-sm text-gray-800">{selectedCooperative.contact_phone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
                    <p className="font-semibold text-sm text-gray-800 truncate">{selectedCooperative.contact_email || 'N/A'}</p>
                  </div>
                </div>

                {/* Review Notes */}
                {selectedCooperative.review_notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <Label className="text-xs text-amber-700 uppercase tracking-wider font-bold mb-2 block">⚠ Review Notes</Label>
                    <p className="text-sm text-amber-900 font-medium">{selectedCooperative.review_notes}</p>
                  </div>
                )}

                {/* Documents */}
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-2 mb-3"><FileText className="h-3.5 w-3.5" /> Submitted Documents</Label>
                  {selectedCooperative.submitted_documents && selectedCooperative.submitted_documents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCooperative.submitted_documents.map((doc: any, idx: number) => {
                        const sizeKB = doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : '';
                        const hasData = !!doc.data_url;
                        return (
                          <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-50 p-2 rounded-lg">
                                <FileText className="h-4 w-4 text-blue-500" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-800">{doc.label || doc.type?.replace(/_/g, ' ') || 'Document'}</p>
                                <p className="text-xs text-gray-400">{doc.filename || 'Attached file'}{sizeKB ? ` · ${sizeKB}` : ''}</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!hasData}
                              className="h-8 opacity-70 group-hover:opacity-100 transition-opacity gap-1.5 text-xs font-semibold"
                              onClick={() => {
                                if (doc.data_url) {
                                  const win = window.open('', '_blank');
                                  if (win) {
                                    win.document.write(`<html><body style="margin:0;background:#000"><img src="${doc.data_url}" style="max-width:100%;display:block;margin:auto" onerror="this.style.display='none';document.body.innerHTML='<iframe src=&quot;${doc.data_url}&quot; style=&quot;width:100%;height:100vh;border:none&quot;></iframe>'"/></body></html>`);
                                    win.document.close();
                                  }
                                }
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" /> Open
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                      <FileText className="h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500 font-medium">No documents uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Review and approve or reject this cooperative registration
            </DialogDescription>
          </DialogHeader>
          {selectedCooperative && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">Cooperative</Label>
                <p className="font-medium">{selectedCooperative.name}</p>
              </div>
              <div>
                <Label>Review Notes</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  data-testid="input-review-notes"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
            <Button
              variant="outline"
              className="text-orange-600"
              onClick={() => handleUpdateStatus('needs_resubmission')}
              disabled={submitting}
              data-testid="button-resubmit"
            >
              Request Resubmission
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleUpdateStatus('rejected')}
              disabled={submitting}
              data-testid="button-reject"
            >
              Reject
            </Button>
            <Button
              onClick={() => handleUpdateStatus('approved')}
              disabled={submitting}
              data-testid="button-approve"
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CooperativeRegistration;
