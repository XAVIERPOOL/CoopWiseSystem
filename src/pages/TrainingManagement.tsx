import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Edit3,
  Trash2,
  Eye,
  UserPlus,
  Loader2,
  ChevronDown,
  ChevronRight,
  CalendarClock,
  PlayCircle,
  CheckCircle2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';

interface TrainingWithRegistrations {
  id: string;
  training_id: string;
  title: string;
  topic: string;
  date: string;
  start_date: string;
  end_date: string | null;
  time: string | null;
  venue: string;
  capacity: number;
  speaker: string;
  status: string;
  registered: number;
}

interface Officer {
  id: string;
  full_name: string;
  cooperative: string | null;
  position: string | null;
  role: string;
  username: string;
}

const STATUS_ORDER = ['ongoing', 'upcoming', 'completed'] as const;

const STATUS_CONFIG = {
  upcoming: {
    label: 'Upcoming',
    icon: CalendarClock,
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    headerClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    description: 'Scheduled training sessions that have not started yet'
  },
  ongoing: {
    label: 'Ongoing',
    icon: PlayCircle,
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    headerClass: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    description: 'Training sessions currently in progress'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    headerClass: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    description: 'Training sessions that have been finished'
  }
};

const TrainingManagement = () => {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<TrainingWithRegistrations | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);
  const [enrollmentMethod, setEnrollmentMethod] = useState<string>('manual');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    upcoming: true,
    ongoing: true,
    completed: true
  });
  
  const [formData, setFormData] = useState({
    training_id: '',
    title: '',
    topic: '',
    date: '',
    start_date: '',
    end_date: '',
    time: '',
    venue: '',
    capacity: '',
    speaker: '',
    status: 'upcoming'
  });

  const [trainings, setTrainings] = useState<TrainingWithRegistrations[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [enrolledOfficers, setEnrolledOfficers] = useState<any[]>([]);
  const [selectedTrainingEnrollments, setSelectedTrainingEnrollments] = useState<any[]>([]);
  const [viewEnrolledDialogOpen, setViewEnrolledDialogOpen] = useState(false);
  const [selectedTrainingTitle, setSelectedTrainingTitle] = useState<string>('');

  const groupedTrainings = useMemo(() => {
    const groups: Record<string, TrainingWithRegistrations[]> = {
      upcoming: [],
      ongoing: [],
      completed: []
    };

    trainings.forEach(training => {
      const status = training.status?.toLowerCase() || 'upcoming';
      if (groups[status]) {
        groups[status].push(training);
      } else {
        groups.upcoming.push(training);
      }
    });

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    });

    return groups;
  }, [trainings]);

  const toggleSection = (status: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Load data on component mount
  useEffect(() => {
    loadTrainings();
    loadOfficers();
  }, []);

  const loadTrainings = async () => {
    try {
      // Use the API endpoint that includes registration counts
      const { data: trainingsData, error } = await api.getTrainingsWithMetrics();

      if (error) throw error;

      // Convert registered count from string to number and ensure time field
      const trainingsWithCounts = (trainingsData || []).map(training => ({
        ...training,
        time: training.time || null,
        registered: parseInt(training.registered) || 0
      }));

      setTrainings(trainingsWithCounts);
    } catch (error) {
      console.error('Error loading trainings:', error);
      toast({
        title: "Error",
        description: "Failed to load trainings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOfficers = async () => {
    try {
      const { data, error } = await api.getProfiles();

      if (error) throw error;
      
      // Filter for officers only
      const officerProfiles = (data || []).filter(profile => profile.role === 'officer');
      setOfficers(officerProfiles);
    } catch (error) {
      console.error('Error loading officers:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      training_id: '',
      title: '',
      topic: '',
      date: '',
      start_date: '',
      end_date: '',
      time: '',
      venue: '',
      capacity: '',
      speaker: '',
      status: 'upcoming'
    });
    setCreateDialogOpen(false);
    setEditingTraining(null);
  };

  const generateTrainingId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TRN-${year}-${random}`;
  };

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.start_date || !formData.venue) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (title, start date, venue)",
        variant: "destructive",
      });
      return;
    }

    try {
      // --- GET THE CURRENT USER ID ---
      const currentUserId = localStorage.getItem('userId'); 

      if (editingTraining) {
        // Update existing training
        const { error } = await api.updateTraining(editingTraining.id, {
          title: formData.title,
          topic: formData.topic,
          date: formData.start_date,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          time: formData.time || null,
          venue: formData.venue,
          capacity: parseInt(formData.capacity) || 30,
          speaker: formData.speaker,
          status: formData.status,
          updated_by: currentUserId // <--- ADD THIS LINE HERE
        });

        if (error) throw error;

        toast({
          title: "Training Updated",
          description: `"${formData.title}" has been successfully updated.`,
        });
      } else {
        // Create new training
        const { error } = await api.createTraining({
          training_id: generateTrainingId(),
          title: formData.title,
          topic: formData.topic,
          date: formData.start_date,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          time: formData.time || null,
          venue: formData.venue,
          capacity: parseInt(formData.capacity) || 30,
          speaker: formData.speaker,
          status: formData.status
          // You can also add created_by: currentUserId here if you update the POST endpoint later
        });

        if (error) throw error;

        toast({
          title: "Training Event Created",
          description: `"${formData.title}" has been successfully created.`,
        });
      }

      resetForm();
      loadTrainings();
    } catch (error) {
      console.error('Error saving training:', error);
      toast({
        title: "Error",
        description: "Failed to save training event",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (training: TrainingWithRegistrations) => {
    setFormData({
      training_id: training.training_id,
      title: training.title,
      topic: training.topic,
      date: training.date,
      start_date: training.start_date,
      end_date: training.end_date || '',
      time: training.time || '',
      venue: training.venue,
      capacity: training.capacity.toString(),
      speaker: training.speaker,
      status: training.status
    });
    setEditingTraining(training);
    setCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await api.deleteTraining(id);

      if (error) throw error;

      toast({
        title: "Training Deleted",
        description: "Training has been successfully deleted.",
      });

      loadTrainings();
    } catch (error) {
      console.error('Error deleting training:', error);
      toast({
        title: "Error",
        description: "Failed to delete training",
        variant: "destructive",
      });
    }
  };

  const handleEnrollOfficer = async (officerId: string) => {
    if (!selectedTrainingId) return;

    try {
      // Enroll officer in training
      const { error } = await api.createTrainingRegistration({
        training_id: selectedTrainingId,
        officer_id: officerId
      });

      if (error) throw error;

      toast({
        title: "Officer Enrolled",
        description: "Officer successfully enrolled in training.",
      });

      setEnrollmentDialogOpen(false);
      loadTrainings();
    } catch (error) {
      console.error('Error enrolling officer:', error);
      toast({
        title: "Error",
        description: "Failed to enroll officer",
        variant: "destructive",
      });
    }
  };

  const loadEnrolledOfficers = async (trainingId: string) => {
    try {
      // Load enrolled officers with their profile information
      const { data: registrations, error: regError } = await api.getTrainingRegistrationsByTraining(trainingId);

      if (regError) {
        console.error('Error loading enrolled officers:', regError);
        return [];
      }

      // Load companions for the training
      const { data: companions, error: companionsError } = await api.getCompanionRegistrationsByTraining(trainingId);

      if (companionsError) {
        console.error('Error loading companions:', companionsError);
      }

      // Combine officers and companions data
      const enrolledData = (registrations || []).map(registration => ({
        ...registration,
        type: 'officer' as const,
        companions: (companions || []).filter(c => c.officer_id === registration.officer_id)
      }));

      return enrolledData;
    } catch (error) {
      console.error('Error loading enrolled officers:', error);
      return [];
    }
  };

  const handleViewEnrolled = async (trainingId: string) => {
    const enrolled = await loadEnrolledOfficers(trainingId);
    setSelectedTrainingEnrollments(enrolled);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout
      title="Training & Seminar Management"
      description="Create and manage training events"
    >
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading trainings...</span>
            </div>
          </div>
        ) : (
          <>
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Training Events</h2>
            <p className="text-gray-600">Manage your cooperative training programs</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingTraining(null);
                  resetForm();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Training
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTraining ? 'Edit Training Event' : 'Create New Training Event'}
                </DialogTitle>
                <DialogDescription>
                  {editingTraining 
                    ? 'Update the training event details below'
                    : 'Fill in the details below to create a new training session'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Training Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g., Financial Management Basics"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      value={formData.topic}
                      onChange={(e) => setFormData({...formData, topic: e.target.value})}
                      placeholder="e.g., Finance, Governance"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value, date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      placeholder="Leave blank for single-day training"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue *</Label>
                    <Input
                      id="venue"
                      value={formData.venue}
                      onChange={(e) => setFormData({...formData, venue: e.target.value})}
                      placeholder="e.g., Conference Room A"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      placeholder="Maximum participants (default: 30)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="speaker">Speaker/Facilitator</Label>
                    <Input
                      id="speaker"
                      value={formData.speaker}
                      onChange={(e) => setFormData({...formData, speaker: e.target.value})}
                      placeholder="e.g., Dr. Maria Santos"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingTraining ? 'Update Training Event' : 'Create Training Event'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Training Sections by Status */}
        <div className="space-y-6">
          {STATUS_ORDER.map((status) => {
            const config = STATUS_CONFIG[status];
            const StatusIcon = config.icon;
            const statusTrainings = groupedTrainings[status] || [];
            const isExpanded = expandedSections[status];

            return (
              <Collapsible
                key={status}
                open={isExpanded}
                onOpenChange={() => toggleSection(status)}
              >
                <div className={`rounded-lg border ${config.headerClass}`}>
                  <CollapsibleTrigger asChild>
                    <button
                      className="w-full flex items-center justify-between gap-4 p-4 text-left"
                      data-testid={`section-toggle-${status}`}
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5" />
                        <div>
                          <h3 className="text-lg font-semibold">{config.label}</h3>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={config.badgeClass}>
                          {statusTrainings.length} {statusTrainings.length === 1 ? 'training' : 'trainings'}
                        </Badge>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="p-4 pt-0">
                      {statusTrainings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No {config.label.toLowerCase()} trainings at this time
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          {statusTrainings.map((training) => (
                            <Card key={training.id} className="hover:shadow-lg transition-shadow" data-testid={`card-training-${training.id}`}>
                              <CardHeader>
                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <Badge variant="secondary" className={getStatusColor(training.status)}>
                                    {training.status}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground truncate">{training.topic}</span>
                                </div>
                                <CardTitle className="text-lg">{training.title}</CardTitle>
                                <CardDescription className="text-sm">
                                  ID: {training.training_id}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span>
                                      {new Date(training.start_date).toLocaleDateString()}
                                      {training.end_date && training.end_date !== training.start_date && 
                                        ` - ${new Date(training.end_date).toLocaleDateString()}`}
                                      {training.time && ` at ${training.time}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span className="truncate">{training.venue}</span>
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span>{training.registered}/{training.capacity} registered</span>
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span className="truncate">Speaker: {training.speaker}</span>
                                  </div>
                                </div>

                                <div className="flex justify-between mt-4 pt-4 border-t gap-2">
                                  <Dialog open={viewEnrolledDialogOpen} onOpenChange={setViewEnrolledDialogOpen}>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedTrainingTitle(training.title);
                                          handleViewEnrolled(training.id);
                                          setViewEnrolledDialogOpen(true);
                                        }}
                                        data-testid={`button-view-enrolled-${training.id}`}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View Enrolled
                                      </Button>
                                    </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Enrolled Participants</DialogTitle>
                            <DialogDescription>
                              Officers and companions enrolled in {selectedTrainingTitle}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {selectedTrainingEnrollments.map((enrollment) => (
                              <div key={enrollment.id} className="border rounded-lg p-4">
                                {/* Officer Information */}
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <p className="font-medium text-base">{enrollment.profiles?.full_name || 'Unknown Officer'}</p>
                                    <p className="text-sm text-gray-500">{enrollment.profiles?.cooperative || 'No cooperative'}</p>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="default" className="bg-blue-100 text-blue-800">Officer</Badge>
                                    <Badge variant="outline" className="ml-2">{enrollment.profiles?.position || 'Officer'}</Badge>
                                    {enrollment.registered_at && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        Enrolled: {new Date(enrollment.registered_at).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Companions Information */}
                                {enrollment.companions && enrollment.companions.length > 0 && (
                                  <div className="ml-4 border-l-2 border-gray-200 pl-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                      Companions ({enrollment.companions.length}):
                                    </p>
                                    <div className="space-y-2">
                                      {enrollment.companions.map((companion: any, index: number) => (
                                        <div key={companion.id} className="bg-gray-50 rounded p-3">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="font-medium text-sm">{companion.companion_name}</p>
                                              <p className="text-xs text-gray-500">{companion.companion_email}</p>
                                              {companion.companion_phone && (
                                                <p className="text-xs text-gray-500">{companion.companion_phone}</p>
                                              )}
                                            </div>
                                            <div className="text-right">
                                              <Badge variant="secondary" className="bg-green-100 text-green-800">Companion</Badge>
                                              {companion.companion_position && (
                                                <p className="text-xs text-gray-400 mt-1">{companion.companion_position}</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                            {selectedTrainingEnrollments.length === 0 && (
                              <p className="text-gray-500 text-center py-8">No officers enrolled yet</p>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                                  <div className="flex gap-1">
                                    <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
                                      <DialogTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => setSelectedTrainingId(training.id)}
                                          data-testid={`button-enroll-${training.id}`}
                                        >
                                          <UserPlus className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Enroll Officer</DialogTitle>
                                          <DialogDescription>
                                            Select an officer to enroll in {training.title}
                                          </DialogDescription>
                                        </DialogHeader>
                                        
                                        <div className="space-y-4">
                                          <div>
                                            <Label>Enrollment Method</Label>
                                            <Select value={enrollmentMethod} onValueChange={setEnrollmentMethod}>
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="manual">Manual Entry</SelectItem>
                                                <SelectItem value="qr">QR Code Scan</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {officers.map((officer) => (
                                              <div key={officer.id} className="flex items-center justify-between p-2 border rounded">
                                                <div>
                                                  <p className="font-medium">{officer.full_name}</p>
                                                  <p className="text-sm text-gray-500">{officer.cooperative || 'No cooperative'}</p>
                                                </div>
                                                <Button 
                                                  size="sm"
                                                  onClick={() => handleEnrollOfficer(officer.id)}
                                                >
                                                  Enroll
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>

                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEdit(training)}
                                      data-testid={`button-edit-${training.id}`}
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => handleDelete(training.id)}
                                      data-testid={`button-delete-${training.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrainingManagement;