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
  Users,
  Plus,
  Search,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';

interface Member {
  id: string;
  member_id: string;
  cooperative_id: string;
  cooperative_name?: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  date_of_birth: string;
  gender: string;
  civil_status: string;
  address: string;
  city: string;
  province: string;
  email: string;
  phone: string;
  occupation: string;
  tin: string;
  photo_url: string;
  documents: any[];
  status: string;
  membership_date: string;
  review_notes: string;
  created_at: string;
}

interface Cooperative {
  id: string;
  name: string;
  coop_id: string;
}

const STATUS_ORDER = ['pending', 'approved', 'rejected'] as const;

const STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    description: 'Membership applications awaiting review',
    icon: Clock,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    headerColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  approved: {
    label: 'Approved Members',
    description: 'Active cooperative members',
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    headerColor: 'bg-green-100 dark:bg-green-900/30',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  rejected: {
    label: 'Rejected Applications',
    description: 'Declined membership applications',
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    headerColor: 'bg-red-100 dark:bg-red-900/30',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
};

const MembershipProfiling = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'officer';
  const [members, setMembers] = useState<Member[]>([]);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pending: true,
    approved: true,
    rejected: false,
  });
  
  const [selectedCooperative, setSelectedCooperative] = useState<Cooperative | null>(null);
  const [coopSearchTerm, setCoopSearchTerm] = useState('');
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cooperative_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    date_of_birth: '',
    gender: '',
    civil_status: '',
    address: '',
    city: 'Naga City',
    province: 'Camarines Sur',
    email: '',
    phone: '',
    occupation: '',
    tin: '',
  });

  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchCooperatives();
  }, []);

  useEffect(() => {
    if (selectedCooperative) {
      fetchMembers();
    } else {
      setMembers([]);
    }
  }, [selectedCooperative]);

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

  const fetchMembers = async () => {
    if (!selectedCooperative) return;
    try {
      setLoading(true);
      const membersRes = await api.getMembers();
      if (membersRes.error) throw membersRes.error;
      const filteredMembers = (membersRes.data || []).filter(
        (m: Member) => m.cooperative_id === selectedCooperative.id
      );
      setMembers(filteredMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'First name and last name are required',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const memberData = selectedCooperative 
        ? { ...formData, cooperative_id: selectedCooperative.id }
        : formData;
      const { error } = await api.createMember(memberData);
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Membership application submitted successfully',
      });
      setShowCreateDialog(false);
      resetForm();
      fetchMembers();
    } catch (error) {
      console.error('Error creating member:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedMember) return;

    setSubmitting(true);
    try {
      const { error } = await api.updateMemberStatus(selectedMember.id, {
        status,
        review_notes: reviewNotes,
        reviewed_by: '11111111-1111-1111-1111-111111111111',
      });
      if (error) throw error;

      toast({
        title: 'Success',
        description: `Membership ${status === 'approved' ? 'approved' : 'rejected'}`,
      });
      setShowReviewDialog(false);
      setReviewNotes('');
      fetchMembers();
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

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member profile?')) return;

    try {
      const { error } = await api.deleteMember(id);
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member deleted successfully',
      });
      fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete member',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      cooperative_id: selectedCooperative?.id || '',
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: '',
      date_of_birth: '',
      gender: '',
      civil_status: '',
      address: '',
      city: 'Naga City',
      province: 'Camarines Sur',
      email: '',
      phone: '',
      occupation: '',
      tin: '',
    });
  };

  const toggleSection = (status: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const getFullName = (member: Member) => {
    const parts = [member.first_name, member.middle_name, member.last_name, member.suffix].filter(Boolean);
    return parts.join(' ');
  };

  const filteredCooperatives = cooperatives.filter(coop => {
    const search = coopSearchTerm.toLowerCase();
    return coop.name.toLowerCase().includes(search) ||
      coop.coop_id?.toLowerCase().includes(search);
  });

  const getMemberCountForCoop = (coopId: string) => {
    return members.filter(m => m.cooperative_id === coopId).length;
  };

  const filteredMembers = members.filter(member => {
    if (selectedCooperative && member.cooperative_id !== selectedCooperative.id) {
      return false;
    }
    const fullName = getFullName(member).toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) ||
      member.member_id?.toLowerCase().includes(search) ||
      member.cooperative_name?.toLowerCase().includes(search);
  });

  const groupedMembers = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = filteredMembers.filter(m => m.status === status);
    return acc;
  }, {} as Record<string, Member[]>);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSelectCooperative = (coop: Cooperative) => {
    setSelectedCooperative(coop);
    setFormData(prev => ({ ...prev, cooperative_id: coop.id }));
  };

  const handleBackToCooperatives = () => {
    setSelectedCooperative(null);
    setSearchTerm('');
  };

  if (!selectedCooperative) {
    return (
      <DashboardLayout
        title="Membership Profiling"
        description="Select a cooperative to manage members"
      >
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Select Cooperative
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search cooperatives..."
                value={coopSearchTerm}
                onChange={(e) => setCoopSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-coop-search"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredCooperatives.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {coopSearchTerm ? 'No cooperatives found matching your search' : 'No active cooperatives available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCooperatives.map(coop => {
                const memberCount = getMemberCountForCoop(coop.id);
                return (
                  <Card 
                    key={coop.id} 
                    className="glass-card cursor-pointer hover-elevate active-elevate-2 transition-all"
                    onClick={() => handleSelectCooperative(coop)}
                    data-testid={`card-coop-${coop.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{coop.name}</CardTitle>
                          <CardDescription className="text-sm">ID: {coop.coop_id}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Members - ${selectedCooperative.name}`}
      description={`Manage members for ${selectedCooperative.name} (${selectedCooperative.coop_id})`}
    >
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleBackToCooperatives}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Member Applications
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search"
              />
            </div>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create">
              <Plus className="h-4 w-4 mr-2" />
              New Application
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
              const items = groupedMembers[status] || [];

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
                            <Badge variant="secondary">{items.length} members</Badge>
                            <ChevronDown className={`h-5 w-5 transition-transform ${expandedSections[status] ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-4">
                        {items.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No members in this category</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map(member => (
                              <Card key={member.id} className="bg-white dark:bg-gray-800">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <Badge className={config.badgeClass}>{status}</Badge>
                                  </div>
                                  <CardTitle className="text-base mt-2">{getFullName(member)}</CardTitle>
                                  <CardDescription>ID: {member.member_id}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Mail className="h-4 w-4" />
                                    <span className="truncate">{member.email || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Phone className="h-4 w-4" />
                                    <span>{member.phone || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Calendar className="h-4 w-4" />
                                    <span>Applied: {formatDate(member.created_at)}</span>
                                  </div>
                                  <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedMember(member);
                                        setShowViewDialog(true);
                                      }}
                                      data-testid={`button-view-${member.id}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {userRole === 'administrator' && status === 'pending' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedMember(member);
                                          setShowReviewDialog(true);
                                        }}
                                        data-testid={`button-review-${member.id}`}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {userRole === 'administrator' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600"
                                        onClick={() => handleDeleteMember(member.id)}
                                        data-testid={`button-delete-${member.id}`}
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Membership Application</DialogTitle>
            <DialogDescription>
              Submit a new membership application for {selectedCooperative.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Cooperative</Label>
              <Input
                value={selectedCooperative.name}
                disabled
                className="bg-muted"
                data-testid="input-cooperative-name"
              />
            </div>
            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label>Middle Name</Label>
              <Input
                value={formData.middle_name}
                onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                data-testid="input-middle-name"
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                data-testid="input-last-name"
              />
            </div>
            <div>
              <Label>Suffix</Label>
              <Input
                value={formData.suffix}
                onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                placeholder="Jr., Sr., III, etc."
                data-testid="input-suffix"
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                data-testid="input-dob"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger data-testid="select-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Civil Status</Label>
              <Select
                value={formData.civil_status}
                onValueChange={(value) => setFormData({ ...formData, civil_status: value })}
              >
                <SelectTrigger data-testid="select-civil-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                  <SelectItem value="Separated">Separated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Occupation</Label>
              <Input
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                data-testid="input-occupation"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Complete address"
                data-testid="input-address"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                data-testid="input-city"
              />
            </div>
            <div>
              <Label>Province</Label>
              <Input
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                data-testid="input-province"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-email"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                data-testid="input-phone"
              />
            </div>
            <div>
              <Label>TIN</Label>
              <Input
                value={formData.tin}
                onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                data-testid="input-tin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateMember} disabled={submitting} data-testid="button-submit">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">Full Name</Label>
                <p className="font-medium">{getFullName(selectedMember)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Member ID</Label>
                  <p>{selectedMember.member_id}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Cooperative</Label>
                  <p>{selectedMember.cooperative_name || selectedCooperative.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Date of Birth</Label>
                  <p>{formatDate(selectedMember.date_of_birth)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Gender</Label>
                  <p>{selectedMember.gender || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Civil Status</Label>
                  <p>{selectedMember.civil_status || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Occupation</Label>
                  <p>{selectedMember.occupation || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Address</Label>
                <p>{selectedMember.address || 'N/A'}</p>
                <p>{selectedMember.city}, {selectedMember.province}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p>{selectedMember.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Phone</Label>
                  <p>{selectedMember.phone || 'N/A'}</p>
                </div>
              </div>
              {selectedMember.membership_date && (
                <div>
                  <Label className="text-gray-500">Membership Date</Label>
                  <p>{formatDate(selectedMember.membership_date)}</p>
                </div>
              )}
              {selectedMember.review_notes && (
                <div>
                  <Label className="text-gray-500">Review Notes</Label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {selectedMember.review_notes}
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
              Review and approve or reject this membership application
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">Applicant</Label>
                <p className="font-medium">{getFullName(selectedMember)}</p>
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

export default MembershipProfiling;
