import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { 
  Lightbulb,
  Calendar,
  User,
  Tag,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Rocket,
  MapPin,
  Users,
  GraduationCap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface TrainingSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  preferred_date?: string;
  justification?: string;
  priority: string;
  status: string;
  officer_id: string;
  officer_name?: string;
  created_at: string;
}

const priorityColors: { [key: string]: string } = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const statusColors: { [key: string]: string } = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  implemented: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
};

const TrainingSuggestions = () => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<TrainingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [implementDialogOpen, setImplementDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<TrainingSuggestion | null>(null);
  const [implementing, setImplementing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  
  const [trainingDetails, setTrainingDetails] = useState({
    venue: '',
    speaker: '',
    capacity: 50,
    start_date: '',
    end_date: '',
    time: '09:00'
  });

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.getTrainingSuggestions();
      
      if (error) throw error;
      
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to load training suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImplementClick = (suggestion: TrainingSuggestion) => {
    setSelectedSuggestion(suggestion);
    setTrainingDetails({
      venue: '',
      speaker: '',
      capacity: 50,
      start_date: suggestion.preferred_date || '',
      end_date: suggestion.preferred_date || '',
      time: '09:00'
    });
    setImplementDialogOpen(true);
  };

  const handleRejectClick = (suggestion: TrainingSuggestion) => {
    setSelectedSuggestion(suggestion);
    setRejectDialogOpen(true);
  };

  const handleImplementConfirm = async () => {
    if (!selectedSuggestion) return;
    
    try {
      setImplementing(true);
      const { data, error } = await api.implementSuggestion(selectedSuggestion.id, trainingDetails);
      
      if (error) throw error;
      
      toast({
        title: "Training Created",
        description: `"${selectedSuggestion.title}" has been implemented as a new training.`,
      });
      
      setImplementDialogOpen(false);
      setSelectedSuggestion(null);
      loadSuggestions();
    } catch (error) {
      console.error('Error implementing suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to implement the suggestion",
        variant: "destructive",
      });
    } finally {
      setImplementing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedSuggestion) return;
    
    try {
      setRejecting(true);
      const { error } = await api.updateSuggestionStatus(selectedSuggestion.id, 'rejected');
      
      if (error) throw error;
      
      toast({
        title: "Suggestion Rejected",
        description: `"${selectedSuggestion.title}" has been rejected.`,
      });
      
      setRejectDialogOpen(false);
      setSelectedSuggestion(null);
      loadSuggestions();
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to reject the suggestion",
        variant: "destructive",
      });
    } finally {
      setRejecting(false);
    }
  };

  const getFilteredSuggestions = () => {
    let filtered = suggestions;
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(s => s.status === activeTab);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(suggestion =>
        suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.officer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredSuggestions = getFilteredSuggestions();
  const pendingCount = suggestions.filter(s => s.status === 'pending').length;
  const implementedCount = suggestions.filter(s => s.status === 'implemented').length;
  const rejectedCount = suggestions.filter(s => s.status === 'rejected').length;

  return (
    <DashboardLayout title="Training Suggestions" description="View and manage training suggestions">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{suggestions.length}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Suggestions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <span className="text-2xl font-bold text-amber-600">{pendingCount}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{implementedCount}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Implemented</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <XCircle className="h-5 w-5 text-gray-500" />
                <span className="text-2xl font-bold text-gray-500">{rejectedCount}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Rejected</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title, category, or officer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending" data-testid="tab-pending">
                Pending {pendingCount > 0 && <Badge variant="destructive" className="ml-2 text-xs">{pendingCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="implemented" data-testid="tab-implemented">
                Implemented
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected">
                Rejected
              </TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading suggestions...
            </CardContent>
          </Card>
        ) : filteredSuggestions.length > 0 ? (
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="hover:shadow-md transition-shadow" data-testid={`card-suggestion-${suggestion.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3 gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{suggestion.title}</h3>
                        <Badge className={priorityColors[suggestion.priority] || 'bg-gray-100 text-gray-800'}>
                          {suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)}
                        </Badge>
                        <Badge className={statusColors[suggestion.status] || statusColors.pending}>
                          {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">{suggestion.description}</p>
                      {suggestion.justification && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-3">
                          <strong>Why:</strong> {suggestion.justification}
                        </p>
                      )}
                    </div>
                    
                    {suggestion.status === 'pending' && (
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button 
                          size="sm" 
                          onClick={() => handleImplementClick(suggestion)}
                          data-testid={`button-implement-${suggestion.id}`}
                        >
                          <Rocket className="h-4 w-4 mr-1" />
                          Implement
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRejectClick(suggestion)}
                          data-testid={`button-reject-${suggestion.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {suggestion.status === 'implemented' && (
                      <div className="flex items-center gap-2 text-green-600 flex-shrink-0">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Implemented</span>
                      </div>
                    )}
                    {suggestion.status === 'rejected' && (
                      <div className="flex items-center gap-2 text-gray-500 flex-shrink-0">
                        <XCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Rejected</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm border-t pt-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Tag className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{suggestion.category}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{suggestion.officer_name || 'Unknown Officer'}</span>
                    </div>
                    {suggestion.preferred_date && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>Preferred: {new Date(suggestion.preferred_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Lightbulb className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Submitted: {new Date(suggestion.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No suggestions found' : `No ${activeTab === 'all' ? '' : activeTab + ' '}suggestions`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : activeTab === 'pending' 
                    ? 'All suggestions have been processed'
                    : 'Officers can submit training suggestions from their dashboard'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={implementDialogOpen} onOpenChange={setImplementDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              Implement Training
            </DialogTitle>
            <DialogDescription>
              Create a new training from "{selectedSuggestion?.title}". Fill in the training details below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="venue"
                  placeholder="Enter venue"
                  value={trainingDetails.venue}
                  onChange={(e) => setTrainingDetails({ ...trainingDetails, venue: e.target.value })}
                  className="pl-10"
                  data-testid="input-venue"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="speaker">Speaker/Facilitator</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="speaker"
                  placeholder="Enter speaker name"
                  value={trainingDetails.speaker}
                  onChange={(e) => setTrainingDetails({ ...trainingDetails, speaker: e.target.value })}
                  className="pl-10"
                  data-testid="input-speaker"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={trainingDetails.start_date}
                  onChange={(e) => setTrainingDetails({ ...trainingDetails, start_date: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={trainingDetails.end_date}
                  onChange={(e) => setTrainingDetails({ ...trainingDetails, end_date: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={trainingDetails.time}
                  onChange={(e) => setTrainingDetails({ ...trainingDetails, time: e.target.value })}
                  data-testid="input-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={trainingDetails.capacity}
                    onChange={(e) => setTrainingDetails({ ...trainingDetails, capacity: parseInt(e.target.value) || 50 })}
                    className="pl-10"
                    data-testid="input-capacity"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImplementDialogOpen(false)} data-testid="button-cancel-implement">
              Cancel
            </Button>
            <Button onClick={handleImplementConfirm} disabled={implementing} data-testid="button-confirm-implement">
              {implementing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Training
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Suggestion?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject "{selectedSuggestion?.title}"? This action will mark the suggestion as rejected and remove it from the pending list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reject">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRejectConfirm}
              disabled={rejecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-reject"
            >
              {rejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default TrainingSuggestions;
