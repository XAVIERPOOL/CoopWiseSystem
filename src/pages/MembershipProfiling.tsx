import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  MapPin,
  Phone,
  Mail,
  Building2,
  Briefcase,
  ChevronLeft,
  Plus,
  Users,
  Edit,
  Copy
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
  submitted_documents: any[]; // JSON array
  role: string;
  created_at: string;
}

const MembershipProfiling = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [cooperatives, setCooperatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // View State Navigation
  const [selectedCooperativeId, setSelectedCooperativeId] = useState<string | null>(null);

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
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    occupation: '',
    role: 'Regular Member'
  });

  // Get User Role for permissions
  const userRole = localStorage.getItem('userRole');
  const isAdminOrCompliance = userRole === 'administrator' || userRole === 'compliance_head';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch both members and the master list of cooperatives
      const [membersRes, coopsRes] = await Promise.all([
        api.getMembers(),
        fetch('http://localhost:3001/api/cooperatives')
      ]);

      if (membersRes.error) throw membersRes.error;

      const coopsData = await coopsRes.json();

      setMembers(membersRes.data || []);
      // Only show Approved cooperatives in the Membership Profiling screen
      setCooperatives(coopsData.filter((c: any) => c.status === 'approved') || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load membership data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedCooperativeId) return;

    setSubmitting(true);
    try {
      // Need to find the actual cooperative details from the list to get cooperative_id if needed, 
      // or just use the name for the backend if it handles names instead of UUIDs.
      // Assuming your backend accepts cooperative_id based on the name or you can map it:
      const coopRef = cooperativesList.find(c => c === selectedCooperativeId);

      // Fetch cooperatives to get the actual ID matching the name
      const coopResponse = await fetch('http://localhost:3001/api/cooperatives');
      const cooperatives = await coopResponse.json();
      const matchedCoop = cooperatives.find((c: any) => c.name === selectedCooperativeId);

      if (!matchedCoop) {
        throw new Error("Could not find cooperative database ID for " + selectedCooperativeId);
      }

      const payload = {
        ...newMemberData,
        cooperative_id: matchedCoop.id,
        // Provide exact defaults for required backend fields missing in simple form
        date_of_birth: new Date().toISOString().split('T')[0], // Placeholder
        gender: 'Not Specified',
        civil_status: 'Not Specified',
        province: 'Camarines Sur', // Defaulting based on context
        tin: 'N/A'
      };

      const response = await fetch('http://localhost:3001/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create member');
      }

      const responseData = await response.json();

      toast({
        title: "Success",
        description: "New member added to " + selectedCooperativeId,
      });

      if (responseData.generatedCredentials) {
        setGeneratedCredentials(responseData.generatedCredentials);
      }

      setIsAddMemberOpen(false);
      setNewMemberData({
        first_name: '', middle_name: '', last_name: '',
        email: '', phone: '', address: '', city: '', occupation: '', role: 'Regular Member'
      });

      fetchData(); // Refresh list to show new member
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add member",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMember = async () => {
    if (!selectedMember) return;

    setSubmitting(true);
    try {
      const payload = {
        ...selectedMember, // Keep existing background data
        ...newMemberData   // Override with form updates
      };

      const response = await fetch(`http://localhost:3001/api/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update member');
      }

      toast({
        title: "Success",
        description: "Member profile updated successfully",
      });

      setIsEditMemberOpen(false);
      fetchData(); // Refresh list to show updates
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update member",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'approved' | 'rejected') => {
    if (!selectedMember) return;

    setSubmitting(true);
    try {
      // --- CRITICAL: Get the logged-in User ID for Audit Logs ---
      const currentUserId = localStorage.getItem('userId');

      // Call API
      const response = await fetch(`http://localhost:3001/api/members/${selectedMember.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          review_notes: reviewNotes,
          reviewed_by: currentUserId, // <--- Sends ID for logging
          membership_date: newStatus === 'approved' ? new Date().toISOString() : null
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      const data = await response.json();

      toast({
        title: "Success",
        description: `Member application ${newStatus}`,
      });

      setIsReviewOpen(false);
      setReviewNotes('');
      fetchData(); // Refresh list

      if (data.generatedCredentials) {
        setGeneratedCredentials(data.generatedCredentials);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update member status",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredMembers = members.filter(m =>
    m.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cooperative_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group members by cooperative (Now pulls from the actual Cooperative list!)
  const cooperativesList = cooperatives.map(c => c.name).filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Aggregate stats per cooperative
  const getCooperativeStats = (coopName: string) => {
    const coopMembers = filteredMembers.filter(m => m.cooperative_name === coopName);
    return {
      total: coopMembers.length,
      pending: coopMembers.filter(m => m.status === 'pending').length,
      approved: coopMembers.filter(m => m.status === 'approved').length,
      rejected: coopMembers.filter(m => m.status === 'rejected').length,
    };
  };

  // The members to display when a cooperative is selected
  const displayMembers = selectedCooperativeId
    ? filteredMembers.filter(m => m.cooperative_name === selectedCooperativeId)
    : [];

  const handleExportRoster = () => {
    if (!selectedCooperativeId || displayMembers.length === 0) {
      toast({ title: 'No Data', description: 'No members to export.' });
      return;
    }

    const headers = ['Member ID', 'Last Name', 'First Name', 'Middle Name', 'Email', 'Phone', 'Role', 'Occupation', 'Status'];
    const csvContent = displayMembers.map(m =>
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
  };

  return (
    <DashboardLayout
      title="Membership Profiling"
      description="Manage and validate cooperative member profiles"
    >
      <div className="p-6 space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or cooperative..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter List
          </Button>
        </div>

        {/* Main Content */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                {selectedCooperativeId ? (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedCooperativeId(null)}
                      className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <CardTitle>{selectedCooperativeId}</CardTitle>
                      <CardDescription>
                        {displayMembers.length} / 15 Members Maximum
                      </CardDescription>
                    </div>
                  </div>
                ) : (
                  <div>
                    <CardTitle>Member Directory</CardTitle>
                    <CardDescription>Select a cooperative to view its members</CardDescription>
                  </div>
                )}
              </div>

              {/* Action Buttons (Only visible if a coop is selected) */}
              {selectedCooperativeId && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleExportRoster}
                    disabled={displayMembers.length === 0}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Export Roster
                  </Button>
                  <Button
                    onClick={() => setIsAddMemberOpen(true)}
                    disabled={displayMembers.length >= 15}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Member
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10">Loading profiles...</div>
            ) : !selectedCooperativeId ? (
              // SCOPE 1: COOPERATIVE CARDS VIEW
              cooperativesList.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No cooperatives found matching your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cooperativesList.map((coopName) => {
                    const stats = getCooperativeStats(coopName);
                    return (
                      <Card
                        key={coopName}
                        className="cursor-pointer group hover:shadow-soft transition-all duration-200 border-gray-100 dark:border-gray-800"
                        onClick={() => setSelectedCooperativeId(coopName)}
                      >
                        <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800/50">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                              <Building2 className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg leading-tight truncate">{coopName}</CardTitle>
                              <CardDescription className="text-sm mt-1">{stats.total} Total Members</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <span className="font-semibold text-green-600 dark:text-green-400">{stats.approved}</span>
                                <span className="text-xs text-muted-foreground">Approved</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="font-semibold text-yellow-600 dark:text-yellow-400">{stats.pending}</span>
                                <span className="text-xs text-muted-foreground">Pending</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="font-semibold text-red-600 dark:text-red-400">{stats.rejected}</span>
                                <span className="text-xs text-muted-foreground">Rejected</span>
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" className="h-8">View <ChevronLeft className="h-4 w-4 rotate-180 ml-1" /></Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )
            ) : (
              // SCOPE 2: MEMBER PROFILES FOR SELECTED COOPERATIVE
              displayMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No members found matching your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayMembers.map((member) => (
                    <Card key={member.id} className="bg-white dark:bg-gray-800 hover:shadow-soft transition-all duration-200 border-gray-100 dark:border-gray-800">
                      <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800/50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg ring-1 ring-blue-100 dark:ring-blue-800">
                              {member.first_name.charAt(0)}
                            </div>
                            <div>
                              <CardTitle className="text-lg leading-tight">{member.last_name}, {member.first_name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <CardDescription className="text-xs">{member.member_id}</CardDescription>
                                {member.role && member.role !== 'Regular Member' && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 h-4 
                                      ${member.role === 'President' || member.role === 'Vice President' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400'}`
                                    }
                                  >
                                    {member.role}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(member.status)}>
                            {member.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="p-1.5 rounded-md">
                              <Briefcase className="h-4 w-4 text-gray-400" />
                            </div>
                            <span>{member.occupation || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="p-1.5 rounded-md">
                              <Mail className="h-4 w-4 text-gray-400" />
                            </div>
                            <span className="truncate">{member.email}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="p-1.5 rounded-md">
                              <Phone className="h-4 w-4 text-gray-400" />
                            </div>
                            <span>{member.phone}</span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-50 dark:border-gray-800/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember(member);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </Button>

                          {isAdminOrCompliance && member.status === 'pending' && (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMember(member);
                                setIsReviewOpen(true);
                              }}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* View Details Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Member Profile</DialogTitle>
              <DialogDescription>Full details for {selectedMember?.first_name} {selectedMember?.last_name}</DialogDescription>
            </DialogHeader>
            {selectedMember && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <User className="h-8 w-8 text-blue-600" />
                    <div>
                      <h4 className="font-bold text-lg">{selectedMember.last_name}, {selectedMember.first_name}</h4>
                      <p className="text-sm text-gray-600">{selectedMember.occupation}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-500">Contact Information</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedMember.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedMember.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{selectedMember.address}, {selectedMember.city}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Personal Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Gender:</span> {selectedMember.gender}</div>
                      <div><span className="text-gray-500">Civil Status:</span> {selectedMember.civil_status}</div>
                      <div><span className="text-gray-500">Birthdate:</span> {new Date(selectedMember.date_of_birth).toLocaleDateString()}</div>
                      <div><span className="text-gray-500">Cooperative:</span> {selectedMember.cooperative_name}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Submitted Documents</h4>
                    <div className="flex flex-wrap gap-2">
                      {/* Placeholder for documents */}
                      <Badge variant="secondary">Application Form</Badge>
                      <Badge variant="secondary">Valid ID</Badge>
                      <Badge variant="secondary">Photo</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedMember) {
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
                  }
                }}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
              <Button onClick={() => setIsViewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approval/Review Dialog */}
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Application</DialogTitle>
              <DialogDescription>Action required for {selectedMember?.first_name}'s application.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea
                  placeholder="Enter reason for approval or rejection..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="destructive"
                onClick={() => handleUpdateStatus('rejected')}
                disabled={submitting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleUpdateStatus('approved')}
                disabled={submitting}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>

      {/* Add New Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Register a new member for <strong>{selectedCooperativeId}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>First Name <span className="text-red-500">*</span></Label>
              <Input
                value={newMemberData.first_name}
                onChange={(e) => setNewMemberData({ ...newMemberData, first_name: e.target.value })}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label>Middle Name</Label>
              <Input
                value={newMemberData.middle_name}
                onChange={(e) => setNewMemberData({ ...newMemberData, middle_name: e.target.value })}
                placeholder="Dela"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name <span className="text-red-500">*</span></Label>
              <Input
                value={newMemberData.last_name}
                onChange={(e) => setNewMemberData({ ...newMemberData, last_name: e.target.value })}
                placeholder="Cruz"
              />
            </div>
            <div className="space-y-2">
              <Label>Occupation <span className="text-red-500">*</span></Label>
              <Input
                value={newMemberData.occupation}
                onChange={(e) => setNewMemberData({ ...newMemberData, occupation: e.target.value })}
                placeholder="e.g., Farmer, Teacher"
              />
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>Officer Role <span className="text-red-500">*</span></Label>
              <Select
                value={newMemberData.role}
                onValueChange={(value) => setNewMemberData({ ...newMemberData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="President">President</SelectItem>
                  <SelectItem value="Vice President">Vice President</SelectItem>
                  <SelectItem value="Secretary">Secretary</SelectItem>
                  <SelectItem value="Treasurer">Treasurer</SelectItem>
                  <SelectItem value="Auditor">Auditor</SelectItem>
                  <SelectItem value="Board Member">Board Member</SelectItem>
                  <SelectItem value="Representative">Representative</SelectItem>
                  <SelectItem value="Regular Member">Regular Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 mt-4 mb-2">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Contact Details</h4>
            </div>

            <div className="space-y-2">
              <Label>Email Address <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                value={newMemberData.email}
                onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                placeholder="juan@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number <span className="text-red-500">*</span></Label>
              <Input
                value={newMemberData.phone}
                onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                placeholder="+63 9XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>City <span className="text-red-500">*</span></Label>
              <Input
                value={newMemberData.city}
                onChange={(e) => setNewMemberData({ ...newMemberData, city: e.target.value })}
                placeholder="Naga City"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Complete Address <span className="text-red-500">*</span></Label>
              <Textarea
                value={newMemberData.address}
                onChange={(e) => setNewMemberData({ ...newMemberData, address: e.target.value })}
                placeholder="Street address, barangay"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)} disabled={submitting}>Cancel</Button>
            <Button
              onClick={handleAddMember}
              disabled={
                submitting ||
                !newMemberData.first_name ||
                !newMemberData.last_name ||
                !newMemberData.email ||
                !newMemberData.phone ||
                !newMemberData.city ||
                !newMemberData.address ||
                !newMemberData.occupation
              }
            >
              {submitting ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditMemberOpen} onOpenChange={setIsEditMemberOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Member Profile</DialogTitle>
            <DialogDescription>
              Update information for <strong>{selectedMember?.first_name} {selectedMember?.last_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>First Name <span className="text-red-500">*</span></Label>
              <Input
                value={newMemberData.first_name}
                onChange={(e) => setNewMemberData({ ...newMemberData, first_name: e.target.value })}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label>Middle Name</Label>
              <Input
                value={newMemberData.middle_name}
                onChange={(e) => setNewMemberData({ ...newMemberData, middle_name: e.target.value })}
                placeholder="Dela"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name <span className="text-red-500">*</span></Label>
              <Input
                value={newMemberData.last_name}
                onChange={(e) => setNewMemberData({ ...newMemberData, last_name: e.target.value })}
                placeholder="Cruz"
              />
            </div>
            <div className="space-y-2">
              <Label>Occupation <span className="text-red-500">*</span></Label>
              <Input
                value={newMemberData.occupation}
                onChange={(e) => setNewMemberData({ ...newMemberData, occupation: e.target.value })}
                placeholder="e.g., Farmer, Teacher"
              />
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>Officer Role <span className="text-red-500">*</span></Label>
              <Select
                value={newMemberData.role}
                onValueChange={(value) => setNewMemberData({ ...newMemberData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="President">President</SelectItem>
                  <SelectItem value="Vice President">Vice President</SelectItem>
                  <SelectItem value="Secretary">Secretary</SelectItem>
                  <SelectItem value="Treasurer">Treasurer</SelectItem>
                  <SelectItem value="Auditor">Auditor</SelectItem>
                  <SelectItem value="Board Member">Board Member</SelectItem>
                  <SelectItem value="Representative">Representative</SelectItem>
                  <SelectItem value="Regular Member">Regular Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 mt-4 mb-2">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Contact Details</h4>
            </div>

            <div className="space-y-2">
              <Label>Email Address <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                value={newMemberData.email}
                onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                placeholder="juan@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number <span className="text-red-500">*</span></Label>
              <Input
                value={newMemberData.phone}
                onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                placeholder="+63 9XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>City <span className="text-red-500">*</span></Label>
              <Input
                value={newMemberData.city}
                onChange={(e) => setNewMemberData({ ...newMemberData, city: e.target.value })}
                placeholder="Naga City"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Complete Address <span className="text-red-500">*</span></Label>
              <Textarea
                value={newMemberData.address}
                onChange={(e) => setNewMemberData({ ...newMemberData, address: e.target.value })}
                placeholder="Street address, barangay"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditMemberOpen(false)} disabled={submitting}>Cancel</Button>
            <Button
              onClick={handleEditMember}
              disabled={
                submitting ||
                !newMemberData.first_name ||
                !newMemberData.last_name ||
                !newMemberData.email ||
                !newMemberData.phone ||
                !newMemberData.city ||
                !newMemberData.address ||
                !newMemberData.occupation
              }
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!generatedCredentials} onOpenChange={(open) => {
        if (!open) setGeneratedCredentials(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-green-700 dark:text-green-500 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Officer Account Created!
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              A new user account has been automatically generated for this Officer. Please copy and securely share these credentials with them.
            </DialogDescription>
          </DialogHeader>
          {generatedCredentials && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <div className="flex gap-2">
                  <Input readOnly value={generatedCredentials.username} className="font-mono text-lg bg-gray-50 dark:bg-gray-900" />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCredentials.username);
                      toast({ title: "Copied!", description: "Username copied to clipboard" });
                    }}
                    title="Copy Username"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="flex gap-2">
                  <Input readOnly value={generatedCredentials.password} className="font-mono text-lg bg-gray-50 dark:bg-gray-900" />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCredentials.password);
                      toast({ title: "Copied!", description: "Password copied to clipboard" });
                    }}
                    title="Copy Password"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-end">
            <Button type="button" onClick={() => setGeneratedCredentials(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default MembershipProfiling;