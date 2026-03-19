import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  User, Search, Eye, CheckCircle, XCircle, AlertCircle,
  FileText, MapPin, Phone, Mail, Building2, Briefcase,
  ChevronLeft, Plus, Users, Edit, Copy, Clock, Calendar,
  TrendingUp, Download,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

// Interface matching your Database
interface Member {
  id: string;
  member_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  cooperative_name: string;
  status: 'pending' | 'approved' | 'rejected';
  email: string;
  phone: string;
  address: string;
  city: string;
  occupation: string;
  date_of_birth: string;
  gender: string;
  civil_status: string;
  submitted_documents: any[];
  role: string;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  'President':      'bg-amber-50   text-amber-800   border-amber-200',
  'Vice President': 'bg-amber-50   text-amber-800   border-amber-200',
  'Secretary':      'bg-blue-50    text-blue-800    border-blue-200',
  'Treasurer':      'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Auditor':        'bg-purple-50  text-purple-800  border-purple-200',
  'Board Member':   'bg-indigo-50  text-indigo-800  border-indigo-200',
};

const MembershipProfiling = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [cooperatives, setCooperatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // View State
  const [selectedCooperativeId, setSelectedCooperativeId] = useState<string | null>(null);
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Dialog States
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ username: string, password: string } | null>(null);

  // New Member Form Data
  const [newMemberData, setNewMemberData] = useState({
    first_name: '', middle_name: '', last_name: '',
    email: '', phone: '', address: '', city: '', occupation: '', role: 'Regular Member'
  });

  const userRole = localStorage.getItem('userRole');
  const isAdminOrCompliance = userRole === 'administrator' || userRole === 'compliance_head';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, coopsRes] = await Promise.all([
        api.getMembers(),
        api.getCooperatives()
      ]);
      if (membersRes.error) throw membersRes.error;
      if (coopsRes.error) throw coopsRes.error;
      
      setMembers(membersRes.data || []);
      setCooperatives((coopsRes.data || []).filter((c: any) => c.status === 'approved'));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load membership data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // --- GLOBAL STATS ---
  const globalStats = useMemo(() => ({
    total:    members.length,
    pending:  members.filter(m => m.status === 'pending').length,
    approved: members.filter(m => m.status === 'approved').length,
    rejected: members.filter(m => m.status === 'rejected').length,
  }), [members]);

  const handleAddMember = async () => {
    if (!selectedCooperativeId) return;
    setSubmitting(true);
    try {
      const coopResponse = await api.getCooperatives();
      if (coopResponse.error) throw coopResponse.error;
      const cooperativesData = coopResponse.data || [];
      const matchedCoop = cooperativesData.find((c: any) => c.name === selectedCooperativeId);
      if (!matchedCoop) throw new Error("Could not find cooperative database ID for " + selectedCooperativeId);

      const payload = {
        ...newMemberData,
        cooperative_id: matchedCoop.id,
        date_of_birth: new Date().toISOString().split('T')[0],
        gender: 'Not Specified',
        civil_status: 'Not Specified',
        province: 'Camarines Sur',
        tin: 'N/A'
      };

      const response = await api.createMember(payload);
      if (response.error) throw response.error;

      toast({ title: "Member Added", description: "New member added to " + selectedCooperativeId });

      if (response.data && response.data.generatedCredentials) {
        setGeneratedCredentials(response.data.generatedCredentials);
      }

      setIsAddMemberOpen(false);
      setNewMemberData({ first_name: '', middle_name: '', last_name: '', email: '', phone: '', address: '', city: '', occupation: '', role: 'Regular Member' });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add member", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMember = async () => {
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      const response = await api.updateMember(selectedMember.id, { ...selectedMember, ...newMemberData });
      if (response.error) throw response.error;
      toast({ title: "Success", description: "Member profile updated successfully" });
      setIsEditMemberOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update member", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'approved' | 'rejected') => {
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      const currentUserId = localStorage.getItem('userId');
      const response = await api.updateMemberStatus(selectedMember.id, {
        status: newStatus,
        review_notes: reviewNotes,
        reviewed_by: currentUserId || undefined,
        membership_date: newStatus === 'approved' ? new Date().toISOString() : undefined
      });
      if (response.error) throw response.error;
      const data = response.data || {};
      toast({ title: "Success", description: `Member application ${newStatus}` });
      setIsReviewOpen(false);
      setReviewNotes('');
      fetchData();
      if (data.generatedCredentials) setGeneratedCredentials(data.generatedCredentials);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update member status", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default:         return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const filteredMembers = members.filter(m =>
    m.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cooperative_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cooperativesList = cooperatives.map(c => c.name).filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCooperativeStats = (coopName: string) => {
    const coopMembers = members.filter(m => m.cooperative_name === coopName);
    return {
      total:    coopMembers.length,
      pending:  coopMembers.filter(m => m.status === 'pending').length,
      approved: coopMembers.filter(m => m.status === 'approved').length,
      rejected: coopMembers.filter(m => m.status === 'rejected').length,
    };
  };

  const allDisplayMembers = selectedCooperativeId
    ? filteredMembers.filter(m => m.cooperative_name === selectedCooperativeId)
    : [];

  const displayMembers = useMemo(() =>
    allDisplayMembers.filter(m => memberStatusFilter === 'all' || m.status === memberStatusFilter),
    [allDisplayMembers, memberStatusFilter]
  );

  const handleExportRoster = () => {
    if (!selectedCooperativeId || allDisplayMembers.length === 0) {
      toast({ title: 'No Data', description: 'No members to export.' });
      return;
    }
    const headers = ['Member ID', 'Last Name', 'First Name', 'Middle Name', 'Email', 'Phone', 'Role', 'Occupation', 'Status'];
    const csvContent = allDisplayMembers.map(m =>
      `${m.member_id},"${m.last_name}","${m.first_name}","${m.middle_name || ''}","${m.email}","${m.phone}","${m.role}","${m.occupation}","${m.status}"`
    );
    const blob = new Blob([[headers.join(','), ...csvContent].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedCooperativeId.replace(/\s+/g, '_')}_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exported', description: 'Roster downloaded successfully.' });
  };

  const openEditFromView = () => {
    if (!selectedMember) return;
    setNewMemberData({
      first_name: selectedMember.first_name || '',
      middle_name: selectedMember.middle_name || '',
      last_name: selectedMember.last_name || '',
      email: selectedMember.email || '',
      phone: selectedMember.phone || '',
      address: selectedMember.address || '',
      city: selectedMember.city || '',
      occupation: selectedMember.occupation || '',
      role: selectedMember.role || 'Regular Member'
    });
    setIsViewOpen(false);
    setIsEditMemberOpen(true);
  };

  const MEMBER_FORM_FIELDS = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
        <div className="space-y-2">
          <Label>First Name <span className="text-red-500">*</span></Label>
          <Input value={newMemberData.first_name} onChange={e => setNewMemberData({ ...newMemberData, first_name: e.target.value })} placeholder="Juan" />
        </div>
        <div className="space-y-2">
          <Label>Middle Name</Label>
          <Input value={newMemberData.middle_name} onChange={e => setNewMemberData({ ...newMemberData, middle_name: e.target.value })} placeholder="Dela" />
        </div>
        <div className="space-y-2">
          <Label>Last Name <span className="text-red-500">*</span></Label>
          <Input value={newMemberData.last_name} onChange={e => setNewMemberData({ ...newMemberData, last_name: e.target.value })} placeholder="Cruz" />
        </div>
        <div className="space-y-2">
          <Label>Occupation <span className="text-red-500">*</span></Label>
          <Input value={newMemberData.occupation} onChange={e => setNewMemberData({ ...newMemberData, occupation: e.target.value })} placeholder="e.g., Farmer, Teacher" />
        </div>
        <div className="space-y-2 col-span-1 md:col-span-2">
          <Label>Officer Role <span className="text-red-500">*</span></Label>
          <Select value={newMemberData.role} onValueChange={value => setNewMemberData({ ...newMemberData, role: value })}>
            <SelectTrigger><SelectValue placeholder="Select a role..." /></SelectTrigger>
            <SelectContent>
              {['President','Vice President','Secretary','Treasurer','Auditor','Board Member','Representative','Regular Member'].map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 mt-2 mb-1">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Details</h4>
        </div>
        <div className="space-y-2">
          <Label>Email Address <span className="text-red-500">*</span></Label>
          <Input type="email" value={newMemberData.email} onChange={e => setNewMemberData({ ...newMemberData, email: e.target.value })} placeholder="juan@example.com" />
        </div>
        <div className="space-y-2">
          <Label>Phone Number <span className="text-red-500">*</span></Label>
          <Input value={newMemberData.phone} onChange={e => setNewMemberData({ ...newMemberData, phone: e.target.value })} placeholder="+63 9XX XXX XXXX" />
        </div>
        <div className="space-y-2">
          <Label>City <span className="text-red-500">*</span></Label>
          <Input value={newMemberData.city} onChange={e => setNewMemberData({ ...newMemberData, city: e.target.value })} placeholder="Naga City" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Complete Address <span className="text-red-500">*</span></Label>
          <Textarea value={newMemberData.address} onChange={e => setNewMemberData({ ...newMemberData, address: e.target.value })} placeholder="Street address, barangay" />
        </div>
      </div>
    </>
  );

  const FORM_REQUIRED_OK = !newMemberData.first_name || !newMemberData.last_name || !newMemberData.email || !newMemberData.phone || !newMemberData.city || !newMemberData.address || !newMemberData.occupation;

  return (
    <DashboardLayout title="Membership Profiling" description="Manage and validate cooperative member profiles">
      <div className="p-6 space-y-6">

        {/* ── STATS BANNER ── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a2744] via-[#1e3a67] to-[#1a5c8a] text-white shadow-lg p-6">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 75% 50%, white 0%, transparent 60%)' }} />
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Member Directory</h2>
                <p className="text-blue-200/80 text-sm font-medium mt-0.5">Naga City · Camarines Sur · Region V</p>
              </div>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Members', value: globalStats.total,    color: 'text-white',       icon: <Users className="h-4 w-4 text-white/70" /> },
              { label: 'Pending',       value: globalStats.pending,  color: 'text-amber-300',   icon: <Clock className="h-4 w-4 text-white/70" /> },
              { label: 'Approved',      value: globalStats.approved, color: 'text-emerald-300', icon: <CheckCircle className="h-4 w-4 text-white/70" /> },
              { label: 'Rejected',      value: globalStats.rejected, color: 'text-red-300',     icon: <XCircle className="h-4 w-4 text-white/70" /> },
            ].map(s => (
              <div key={s.label} className="text-left p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  {s.icon}
                  <span className={`text-2xl font-extrabold ${s.color}`}>{s.value}</span>
                </div>
                <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SEARCH BAR ── */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members or cooperatives..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {globalStats.pending > 0 && !selectedCooperativeId && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold px-4 py-2 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              {globalStats.pending} application{globalStats.pending !== 1 ? 's' : ''} awaiting review
            </div>
          )}
        </div>

        {/* ── MAIN CARD ── */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex items-center gap-3">
                {selectedCooperativeId && (
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedCooperativeId(null); setMemberStatusFilter('all'); }} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <div>
                  {selectedCooperativeId ? (
                    <>
                      <CardTitle className="text-lg">{selectedCooperativeId}</CardTitle>
                      <CardDescription>{allDisplayMembers.length} / 15 Members</CardDescription>
                    </>
                  ) : (
                    <>
                      <CardTitle>Cooperative Directory</CardTitle>
                      <CardDescription>Select a cooperative to manage its members</CardDescription>
                    </>
                  )}
                </div>
              </div>

              {selectedCooperativeId && (
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleExportRoster} disabled={allDisplayMembers.length === 0} className="gap-1.5">
                    <Download className="w-4 h-4" /> Export Roster
                  </Button>
                  <Button size="sm" onClick={() => setIsAddMemberOpen(true)} disabled={allDisplayMembers.length >= 15} className="gap-1.5">
                    <Plus className="w-4 h-4" /> Add Member
                  </Button>
                </div>
              )}
            </div>

            {/* ── STATUS FILTER TABS (visible when inside a cooperative) ── */}
            {selectedCooperativeId && (
              <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-lg w-fit">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => {
                  const count = tab === 'all' ? allDisplayMembers.length : allDisplayMembers.filter(m => m.status === tab).length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setMemberStatusFilter(tab)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold capitalize transition-all ${
                        memberStatusFilter === tab
                          ? 'bg-white shadow-sm text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                        tab === 'pending'  ? 'bg-amber-100 text-amber-700' :
                        tab === 'approved' ? 'bg-green-100 text-green-700' :
                        tab === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-200 text-gray-600'
                      }`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-3">
                  <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 font-medium">Loading profiles...</p>
                </div>
              </div>
            ) : !selectedCooperativeId ? (

              /* ── COOPERATIVE CARDS ── */
              cooperativesList.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No cooperatives found</p>
                  <p className="text-sm mt-1">Try adjusting your search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {cooperativesList.map((coopName) => {
                    const stats = getCooperativeStats(coopName);
                    const fillPct = Math.min(100, Math.round((stats.total / 15) * 100));
                    return (
                      <Card
                        key={coopName}
                        className={`cursor-pointer group hover:shadow-md transition-all duration-200 border-gray-200 hover:-translate-y-0.5
                          ${stats.pending > 0 ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-gray-200'}
                        `}
                        onClick={() => setSelectedCooperativeId(coopName)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform shrink-0">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-[15px] leading-snug truncate">{coopName}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <CardDescription className="text-xs">{stats.total} / 15 members</CardDescription>
                                {stats.pending > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                    <AlertCircle className="h-2.5 w-2.5" />
                                    {stats.pending} pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {/* Capacity bar */}
                          <div className="space-y-1.5 mb-4">
                            <div className="flex justify-between text-[11px] text-gray-400 font-semibold">
                              <span>Capacity</span>
                              <span className={fillPct >= 80 ? 'text-red-500' : fillPct >= 50 ? 'text-amber-500' : 'text-emerald-600'}>{fillPct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${fillPct >= 80 ? 'bg-red-400' : fillPct >= 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-3 text-xs">
                              <span className="flex flex-col items-center">
                                <span className="font-bold text-green-600">{stats.approved}</span>
                                <span className="text-gray-400">Approved</span>
                              </span>
                              <span className="flex flex-col items-center">
                                <span className="font-bold text-amber-600">{stats.pending}</span>
                                <span className="text-gray-400">Pending</span>
                              </span>
                              <span className="flex flex-col items-center">
                                <span className="font-bold text-red-600">{stats.rejected}</span>
                                <span className="text-gray-400">Rejected</span>
                              </span>
                            </div>
                            <span className="text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                              View <ChevronLeft className="h-3 w-3 rotate-180" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )

            ) : (

              /* ── MEMBER CARDS ── */
              displayMembers.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No members found</p>
                  <p className="text-sm mt-1">
                    {memberStatusFilter !== 'all' ? `No ${memberStatusFilter} members in this cooperative` : 'Add the first member to get started'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayMembers.map((member) => {
                    const roleCls = ROLE_COLORS[member.role] ?? 'bg-gray-50 text-gray-700 border-gray-200';
                    const submittedDate = member.created_at ? new Date(member.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
                    return (
                      <Card
                        key={member.id}
                        className={`bg-white hover:shadow-md transition-all duration-200 border-gray-200
                          ${member.status === 'pending' ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-gray-200'}
                        `}
                      >
                        <CardHeader className="pb-3 border-b border-gray-50">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                                {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 leading-tight truncate">
                                  {member.last_name}, {member.first_name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="text-[11px] text-gray-400 font-mono">{member.member_id}</span>
                                  {member.role && member.role !== 'Regular Member' && (
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${roleCls}`}>
                                      {member.role}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge className={`text-[11px] capitalize border shrink-0 ${getStatusBadge(member.status)}`}>
                              {member.status}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-3 space-y-2.5">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Briefcase className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{member.occupation || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span>{member.phone}</span>
                            </div>
                            {submittedDate && (
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                <span>Applied {submittedDate}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-gray-50">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 h-8 text-xs hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => { setSelectedMember(member); setIsViewOpen(true); }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View
                            </Button>
                            {isAdminOrCompliance && member.status === 'pending' && (
                              <Button
                                size="sm"
                                className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => { setSelectedMember(member); setIsReviewOpen(true); }}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Review
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* ── VIEW PROFILE DIALOG ── */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {selectedMember?.first_name.charAt(0)}{selectedMember?.last_name.charAt(0)}
                </div>
                <div>
                  <DialogTitle className="text-xl">{selectedMember?.last_name}, {selectedMember?.first_name} {selectedMember?.middle_name}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm text-gray-500 font-mono">{selectedMember?.member_id}</span>
                    <Badge className={`text-xs capitalize border ${getStatusBadge(selectedMember?.status || '')}`}>{selectedMember?.status}</Badge>
                    {selectedMember?.role && selectedMember?.role !== 'Regular Member' && (
                      <Badge variant="outline" className={`text-xs border ${ROLE_COLORS[selectedMember.role] ?? ''}`}>{selectedMember.role}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {selectedMember && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
                {/* Contact */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Contact Info</h4>
                  <div className="space-y-2">
                    {[
                      { icon: <Mail className="h-4 w-4 text-gray-400" />, val: selectedMember.email },
                      { icon: <Phone className="h-4 w-4 text-gray-400" />, val: selectedMember.phone },
                      { icon: <MapPin className="h-4 w-4 text-gray-400" />, val: `${selectedMember.address}, ${selectedMember.city}` },
                      { icon: <Briefcase className="h-4 w-4 text-gray-400" />, val: selectedMember.occupation },
                    ].map((row, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        {row.icon}
                        <span>{row.val || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personal Details */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Personal Details</h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                    {[
                      { label: 'Gender', val: selectedMember.gender },
                      { label: 'Civil Status', val: selectedMember.civil_status },
                      { label: 'Date of Birth', val: selectedMember.date_of_birth ? new Date(selectedMember.date_of_birth).toLocaleDateString() : 'N/A' },
                      { label: 'Cooperative', val: selectedMember.cooperative_name },
                      { label: 'Applied', val: selectedMember.created_at ? new Date(selectedMember.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A' },
                    ].map((row, i) => (
                      <div key={i}>
                        <span className="text-gray-400 text-xs">{row.label}</span>
                        <p className="font-medium text-gray-800">{row.val || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              {isAdminOrCompliance && selectedMember?.status === 'pending' && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 gap-1.5"
                  onClick={() => { setIsViewOpen(false); setIsReviewOpen(true); }}
                >
                  <CheckCircle className="h-4 w-4" /> Review Application
                </Button>
              )}
              <Button variant="outline" onClick={openEditFromView} className="gap-1.5">
                <Edit className="w-4 h-4" /> Edit Profile
              </Button>
              <Button variant="ghost" onClick={() => setIsViewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── REVIEW DIALOG ── */}
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Review Membership Application</DialogTitle>
              <DialogDescription>
                Decision for <strong>{selectedMember?.first_name} {selectedMember?.last_name}</strong>
              </DialogDescription>
            </DialogHeader>

            {/* Member context strip */}
            {selectedMember && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                  {selectedMember.first_name.charAt(0)}{selectedMember.last_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{selectedMember.last_name}, {selectedMember.first_name}</p>
                  <p className="text-xs text-gray-500">{selectedMember.role} · {selectedMember.cooperative_name}</p>
                  {selectedMember.created_at && (
                    <p className="text-xs text-gray-400">Applied {new Date(selectedMember.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2 py-1">
              <Label>Review Notes (Optional)</Label>
              <Textarea
                placeholder="Enter reason for approval or rejection..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="destructive" onClick={() => handleUpdateStatus('rejected')} disabled={submitting}>
                <XCircle className="h-4 w-4 mr-2" /> Reject
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus('approved')} disabled={submitting}>
                <CheckCircle className="h-4 w-4 mr-2" /> Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── ADD MEMBER DIALOG ── */}
        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>Register a new member for <strong>{selectedCooperativeId}</strong>.</DialogDescription>
            </DialogHeader>
            {MEMBER_FORM_FIELDS}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMemberOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleAddMember} disabled={submitting || FORM_REQUIRED_OK}>
                {submitting ? 'Adding...' : 'Add Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── EDIT MEMBER DIALOG ── */}
        <Dialog open={isEditMemberOpen} onOpenChange={setIsEditMemberOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Member Profile</DialogTitle>
              <DialogDescription>Update information for <strong>{selectedMember?.first_name} {selectedMember?.last_name}</strong>.</DialogDescription>
            </DialogHeader>
            {MEMBER_FORM_FIELDS}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditMemberOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleEditMember} disabled={submitting || FORM_REQUIRED_OK}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── GENERATED CREDENTIALS DIALOG ── */}
        <Dialog open={!!generatedCredentials} onOpenChange={(open) => { if (!open) setGeneratedCredentials(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-green-700 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" /> Officer Account Created!
              </DialogTitle>
              <DialogDescription className="text-base pt-2">
                A new user account has been automatically generated for this Officer. Please copy and securely share these credentials with them.
              </DialogDescription>
            </DialogHeader>
            {generatedCredentials && (
              <div className="space-y-4 py-4">
                {[
                  { label: 'Username', value: generatedCredentials.username },
                  { label: 'Password', value: generatedCredentials.password },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-1.5">
                    <Label>{label}</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={value} className="font-mono text-base bg-gray-50" />
                      <Button variant="outline" onClick={() => { navigator.clipboard.writeText(value); toast({ title: "Copied!", description: `${label} copied to clipboard` }); }} title={`Copy ${label}`}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setGeneratedCredentials(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default MembershipProfiling;