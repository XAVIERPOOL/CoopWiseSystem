import { useState, useEffect, useMemo } from 'react';
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
import { AlertCircle, CheckCircle, Clock, FileText, Search, Filter, Folder, ArrowLeft, ArrowRight } from 'lucide-react';
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
  { id: 'Transportation', label: 'Transportation Cooperatives', description: 'Transport services and logistics compliance monitoring.' },
  { id: 'Agricultural', label: 'Agricultural Cooperatives', description: 'Farming, production, and agrarian compliance requirements.' },
  { id: 'Industrial', label: 'Industrial Cooperatives', description: 'Manufacturing, processing, and industrial standards.' },
  { id: 'Service', label: 'Service Cooperatives', description: 'Professional and general service provider compliance.' },
  { id: 'Housing', label: 'Housing Cooperatives', description: 'Real estate and housing development regulations.' },
  { id: 'Health & Wellness', label: 'Health & Wellness', description: 'Medical, health, and wellness service standards.' },
];

// Mock Data for visualization
const MOCK_RECORDS: ComplianceRecord[] = [
  { id: '1', cooperative_name: 'Metro Transport Coop', cooperative_type: 'Transportation', requirement_name: 'Annual Tax Incentives Report', status: 'compliant', submitted_date: '2023-10-15', deadline: '2023-11-30' },
  { id: '2', cooperative_name: 'City Agri Producers', cooperative_type: 'Agricultural', requirement_name: 'Audited Financial Statements', status: 'pending', submitted_date: '2023-10-20', deadline: '2023-10-30' },
  { id: '3', cooperative_name: 'South Industrial Hub', cooperative_type: 'Industrial', requirement_name: 'Social Audit Report', status: 'non-compliant', submitted_date: '2023-09-01', deadline: '2023-09-30', reviewer_notes: 'Incomplete documentation' },
  { id: '4', cooperative_name: 'Blue Collar Services', cooperative_type: 'Service', requirement_name: 'Performance Audit Report', status: 'compliant', submitted_date: '2023-10-10', deadline: '2023-11-15' },
  { id: '5', cooperative_name: 'Urban Housing Dev', cooperative_type: 'Housing', requirement_name: 'List of Officers and Trainings', status: 'pending', submitted_date: '2023-10-25', deadline: '2023-11-01' },
  { id: '6', cooperative_name: 'Wellness First', cooperative_type: 'Health & Wellness', requirement_name: 'Mediation and Conciliation Report', status: 'compliant', submitted_date: '2023-09-15', deadline: '2023-10-15' },
  { id: '7', cooperative_name: 'Speedy Jeeps', cooperative_type: 'Transportation', requirement_name: 'Renewal of Franchise', status: 'pending', submitted_date: '2023-10-28', deadline: '2023-11-10' },
  { id: '8', cooperative_name: 'Green Farms', cooperative_type: 'Agricultural', requirement_name: 'Farm Inputs Report', status: 'compliant', submitted_date: '2023-10-05', deadline: '2023-10-31' },
];

const RegulatoryCompliance = () => {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // View State
  const [view, setView] = useState<'categories' | 'list'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter/Search State for List View
  const [searchTerm, setSearchTerm] = useState('');

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
      const { data, error } = await api.getComplianceRecords();

      // Use mock data if API fails or returns empty array (for demo purposes as requested)
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        console.log("Using mock data for Regulatory Compliance");
        setRecords(MOCK_RECORDS);
      } else if (Array.isArray(data)) {
        // Ensure consistency with the interface, providing defaults if needed
        const processedData = data.map((item: any) => ({
          ...item,
          cooperative_type: item.cooperative_type || 'Uncategorized'
        }));
        setRecords(processedData);
      }
    } catch (error) {
      console.error("Failed to fetch records", error);
      // Fallback to mock data on error too
      setRecords(MOCK_RECORDS);
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
      // Find matching category ID. We assume the cooperative_type in DB matches roughly or contains the ID.
      // For robust matching, we might need a mapping function. 
      // Simple inclusive check for now based on the user's requirement to group by these specific types.

      const typeStr = record.cooperative_type || 'Uncategorized';
      let matchedCategory = COOPERATIVE_CATEGORIES.find(cat => typeStr.includes(cat.id))?.id || 'Uncategorized';

      // If uncategorized and we want to show it, we'd need to add it to metrics, but user asked for specific list.
      // We will only count towards the known categories if they match, or maybe 'Other' if we wanted.
      // For exactness to the requirement "Manual categories", we focus on those. 

      if (metrics[matchedCategory]) {
        if (record.status === 'compliant') {
          metrics[matchedCategory].compliantCount++;
        } else if (record.status === 'pending') { // 'pending' or 'non-compliant'? User said 'Pending Review'. usually means 'pending'.
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
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setView('categories');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'non-compliant': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    }
  };

  const filteredRecords = records.filter(record => {
    if (!selectedCategory) return false;

    // Filter by category match
    const typeStr = record.cooperative_type || 'Uncategorized';
    // Logic must match the metrics logic
    const isMatch = typeStr.includes(selectedCategory); // Simple substring match for "Transportation Cooperatives" -> "Transportation"

    if (!isMatch) return false;

    // Then filter by search term
    return (
      record.cooperative_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.requirement_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <DashboardLayout
      title="Regulatory Compliance"
      description="Monitor and review cooperative compliance requirements"
    >
      <div className="p-6 space-y-6">

        {/* Category Dashboard View */}
        {view === 'categories' && (
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

              <div className="flex w-full md:w-auto gap-4">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cooperative or requirement..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
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
                      filteredRecords.map((record) => (
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
                                <Button variant="secondary" size="sm">Review</Button>
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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