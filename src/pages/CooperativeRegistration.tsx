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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Building2,
  Plus,
  Search,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Check,
  X
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pending: true,
    needs_resubmission: true,
    approved: true,
    rejected: false,
  });
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedCooperative, setSelectedCooperative] = useState<Cooperative | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
      const { data, error } = await api.createCooperative(formData);
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
    setCurrentStep(1);
  };

  const toggleSection = (status: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status],
    }));
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
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cooperative Applications
          </h2>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search cooperatives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search"
              />
            </div>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create">
              <Plus className="h-4 w-4 mr-2" />
              New Registration
            </Button>
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
              const items = groupedCooperatives[status] || [];

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
                            <Badge variant="secondary">{items.length} cooperatives</Badge>
                            <ChevronDown className={`h-5 w-5 transition-transform ${expandedSections[status] ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-4">
                        {items.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No cooperatives in this category</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map(coop => (
                              <Card key={coop.id} className="bg-white dark:bg-gray-800">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <Badge className={config.badgeClass}>{status}</Badge>
                                    <span className="text-xs text-gray-500">{coop.type || 'N/A'}</span>
                                  </div>
                                  <CardTitle className="text-base mt-2">{coop.name}</CardTitle>
                                  <CardDescription>ID: {coop.coop_id}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <MapPin className="h-4 w-4" />
                                    <span className="truncate">{coop.city || 'N/A'}, {coop.province || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Phone className="h-4 w-4" />
                                    <span>{coop.contact_phone || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <FileText className="h-4 w-4" />
                                    <span>Submitted: {formatDate(coop.created_at)}</span>
                                  </div>
                                  <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedCooperative(coop);
                                        setShowViewDialog(true);
                                      }}
                                      data-testid={`button-view-${coop.id}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {userRole === 'administrator' && status === 'pending' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedCooperative(coop);
                                          setShowReviewDialog(true);
                                        }}
                                        data-testid={`button-review-${coop.id}`}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {userRole === 'administrator' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600"
                                        onClick={() => handleDeleteCooperative(coop.id)}
                                        data-testid={`button-delete-${coop.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter cooperative name"
                    data-testid="input-name"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold mb-1 block">Cooperative Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger data-testid="select-type" className="h-11 border-gray-300">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COOPERATIVE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">LOCATION DETAILS</h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700 font-semibold mb-1 block">Street Address <span className="text-red-500">*</span></Label>
                      <Textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Complete street address"
                        data-testid="input-address"
                        className="resize-none h-20 border-gray-300"
                      />
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
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                      placeholder="e.g., 9520-15000123"
                      data-testid="input-registration-number"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
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
                    onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                    placeholder="XXX-XXX-XXX-XXX"
                    data-testid="input-tin"
                    className="h-11 border-gray-300"
                  />
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
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Mark Vincent"
                    data-testid="input-contact-person"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 font-semibold mb-1 block">Contact Email <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="mari@gmail.com"
                      data-testid="input-contact-email"
                      className="h-11 border-gray-300"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-semibold mb-1 block">Contact Phone <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="+63 XXX XXX XXXX"
                      data-testid="input-contact-phone"
                      className="h-11 border-gray-300"
                    />
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
                     <Button variant="outline" size="sm" className="bg-white h-8 text-xs font-semibold px-4 rounded-lg border-gray-300 shadow-sm">Change File</Button>
                     <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50/80 px-3 pr-2 py-1.5 rounded-lg border border-gray-200">
                       <FileText className="w-3.5 h-3.5 text-blue-500/80" />
                       <span className="truncate max-w-[150px] md:max-w-[200px]">Screenshot 2024-10-17 20233...</span>
                       <X className="w-3.5 h-3.5 text-red-500/80 cursor-pointer hover:text-red-600 ml-1 transition-colors" />
                     </div>
                   </div>
                </div>
                
                <div className="border border-gray-200/60 shadow-sm rounded-xl p-4 bg-white transition-all hover:border-gray-300">
                   <div className="mb-3">
                     <h4 className="font-bold text-gray-900 text-[13px] tracking-wide">2. Articles of Cooperation and By-Laws <span className="text-red-500">*</span></h4>
                     <p className="text-xs text-gray-500 mt-1 font-medium">The complete set of your approved cooperative by-laws.</p>
                   </div>
                   <div className="flex flex-wrap items-center gap-3">
                     <Button variant="outline" size="sm" className="bg-white h-8 text-xs font-semibold px-4 rounded-lg border-gray-300 shadow-sm">Change File</Button>
                     <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50/80 px-3 pr-2 py-1.5 rounded-lg border border-gray-200">
                       <FileText className="w-3.5 h-3.5 text-orange-500/80" />
                       <span className="truncate max-w-[150px] md:max-w-[200px]">2.-Parent_s-Permit-final.pdf</span>
                       <X className="w-3.5 h-3.5 text-red-500/80 cursor-pointer hover:text-red-600 ml-1 transition-colors" />
                     </div>
                   </div>
                </div>

                <div className="border border-gray-200/60 shadow-sm rounded-xl p-4 bg-white transition-all hover:border-gray-300">
                   <div className="mb-3">
                     <h4 className="font-bold text-gray-900 text-[13px] tracking-wide">3. Valid ID of Primary Contact Person <span className="text-red-500">*</span></h4>
                     <p className="text-xs text-gray-500 mt-1 font-medium">A clear scan of a government-issued ID for the representative.</p>
                   </div>
                   <div className="flex flex-wrap items-center gap-3">
                     <Button variant="outline" size="sm" className="bg-white h-8 text-xs font-semibold px-4 rounded-lg border-gray-300 shadow-sm">Change File</Button>
                     <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50/80 px-3 pr-2 py-1.5 rounded-lg border border-gray-200">
                       <FileText className="w-3.5 h-3.5 text-green-500/80" />
                       <span className="truncate max-w-[150px] md:max-w-[200px]">642119964_15111185237...</span>
                       <X className="w-3.5 h-3.5 text-red-500/80 cursor-pointer hover:text-red-600 ml-1 transition-colors" />
                     </div>
                   </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-between sm:justify-between items-center w-full pt-4 mt-2 grid-cols-2">
            {currentStep === 1 ? (
              <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-gray-500 hover:text-gray-800 font-semibold h-11 px-6 rounded-full border border-gray-200 hover:bg-gray-50">Cancel</Button>
            ) : (
              <Button variant="ghost" onClick={() => setCurrentStep(prev => prev - 1)} className="text-gray-500 hover:text-gray-800 font-semibold h-11 px-6 rounded-full border border-gray-200 hover:bg-gray-50">Back</Button>
            )}
            
            <div className="flex gap-2 justify-end w-full sm:w-auto ml-auto">
              {currentStep < 4 ? (
                <Button onClick={() => setCurrentStep(prev => prev + 1)} className="bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-md transition-all font-semibold h-11 px-6 rounded-full">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cooperative Details</DialogTitle>
          </DialogHeader>
          {selectedCooperative && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">Cooperative Name</Label>
                <p className="font-medium">{selectedCooperative.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">ID</Label>
                  <p>{selectedCooperative.coop_id}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Type</Label>
                  <p>{selectedCooperative.type || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">CDA Registration</Label>
                  <p>{selectedCooperative.registration_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">TIN</Label>
                  <p>{selectedCooperative.tin || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Address</Label>
                <p>{selectedCooperative.address || 'N/A'}</p>
                <p>{selectedCooperative.city}, {selectedCooperative.province}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Contact Person</Label>
                  <p>{selectedCooperative.contact_person || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Phone</Label>
                  <p>{selectedCooperative.contact_phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Email</Label>
                <p>{selectedCooperative.contact_email || 'N/A'}</p>
              </div>
              {selectedCooperative.review_notes && (
                <div>
                  <Label className="text-gray-500">Review Notes</Label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {selectedCooperative.review_notes}
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
