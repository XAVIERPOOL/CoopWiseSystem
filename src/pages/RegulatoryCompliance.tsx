import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { AlertCircle, CheckCircle, Clock, FileText, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api'; // Ensure you have this imported

// Define interfaces for type safety
interface ComplianceRecord {
  id: string;
  cooperative_name: string;
  requirement_name: string;
  status: 'compliant' | 'non-compliant' | 'pending';
  submitted_date: string;
  deadline: string;
  reviewer_notes?: string;
  file_url?: string;
}

const RegulatoryCompliance = () => {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      // In a real app, replace with api.getComplianceRecords()
      // For now, we simulate data if API fails or returns empty
      const response = await fetch('http://localhost:3001/api/compliance'); 
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setRecords(data);
      }
    } catch (error) {
      console.error("Failed to fetch records", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRecord) return;

    try {
      // --- CRITICAL UPDATE FOR LOGS ---
      // Get the logged-in user's ID so the backend knows who did this
      const currentUserId = localStorage.getItem('userId');
      
      if (!currentUserId) {
        toast({
            title: "Error",
            description: "User session invalid. Please login again.",
            variant: "destructive"
        });
        return;
      }

      const updateData = {
        status: status,
        reviewer_notes: notes,
        reviewed_by: currentUserId, // <--- SENDING THE ID HERE
        submitted_date: new Date().toISOString()
      };

      const response = await fetch(`http://localhost:3001/api/compliance/${selectedRecord.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({
          title: "Status Updated",
          description: `Compliance record marked as ${status}`,
        });
        setIsDialogOpen(false);
        fetchRecords(); // Refresh list
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update the compliance record.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'non-compliant': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    }
  };

  const filteredRecords = records.filter(record => 
    record.cooperative_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.requirement_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout 
      title="Regulatory Compliance" 
      description="Monitor and review cooperative compliance requirements"
    >
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search cooperative or requirement..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter Status
          </Button>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Compliance Records</CardTitle>
            <CardDescription>Manage and review submitted requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cooperative</TableHead>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.cooperative_name}</TableCell>
                    <TableCell>{record.requirement_name}</TableCell>
                    <TableCell>{new Date(record.deadline).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog open={isDialogOpen && selectedRecord?.id === record.id} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (open) {
                            setSelectedRecord(record);
                            setStatus(record.status);
                            setNotes(record.reviewer_notes || '');
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">Review</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review Compliance</DialogTitle>
                            <DialogDescription>
                              Update status for {record.cooperative_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Requirement</Label>
                              <div className="p-3 bg-muted rounded-md text-sm">
                                {record.requirement_name}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Status</Label>
                              <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending Review</SelectItem>
                                  <SelectItem value="compliant">Compliant</SelectItem>
                                  <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Reviewer Notes</Label>
                              <Textarea 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add comments or instructions..."
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdateStatus}>Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RegulatoryCompliance;