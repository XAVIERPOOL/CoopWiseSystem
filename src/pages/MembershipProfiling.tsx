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
  Mail
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
  created_at: string;
}

const MembershipProfiling = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog States
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Get User Role for permissions
  const userRole = localStorage.getItem('userRole');
  const isAdminOrCompliance = userRole === 'administrator' || userRole === 'compliance_head';

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.getMembers(); // Ensure this exists in your api.ts
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load membership profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

      toast({
        title: "Success",
        description: `Member application ${newStatus}`,
      });

      setIsReviewOpen(false);
      setReviewNotes('');
      fetchMembers(); // Refresh list
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
                <CardTitle>Member Directory</CardTitle>
                <CardDescription>Total Members: {members.length}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10">Loading profiles...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Cooperative</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                            {member.first_name.charAt(0)}
                          </div>
                          <div>
                            <div>{member.last_name}, {member.first_name}</div>
                            <div className="text-xs text-gray-500">{member.member_id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.cooperative_name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="text-sm">{member.email}</div>
                        <div className="text-xs text-gray-500">{member.phone}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.status)}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Only Admin/Compliance Head can review Pending members */}
                          {isAdminOrCompliance && member.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedMember(member);
                                setIsReviewOpen(true);
                              }}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
    </DashboardLayout>
  );
};

export default MembershipProfiling;