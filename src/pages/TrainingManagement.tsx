import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Plus,
  MapPin,
  Users,
  Clock,
  Edit3,
  Trash2,
  Eye,
  UserPlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Calendar as CalendarIcon
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  isWithinInterval
} from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OfficerCompliance from '@/components/OfficerCompliance';

// --- TYPES ---
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
  target_positions?: string[] | null;
}

interface Officer {
  id: string;
  full_name: string;
  cooperative: string | null;
  position: string | null;
  role: string;
  username: string;
}

const TrainingManagement = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<TrainingWithRegistrations | null>(null);
  const [loading, setLoading] = useState(true);

  // Enrollment States
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);
  const [enrollmentMethod, setEnrollmentMethod] = useState<string>('manual');

  // Data States
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
    status: 'upcoming',
    target_positions: [] as string[]
  });

  const [trainings, setTrainings] = useState<TrainingWithRegistrations[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);

  // View Enrolled States
  const [selectedTrainingEnrollments, setSelectedTrainingEnrollments] = useState<any[]>([]);
  const [selectedTrainingAttendance, setSelectedTrainingAttendance] = useState<any[]>([]);
  const [viewEnrolledDialogOpen, setViewEnrolledDialogOpen] = useState(false);
  const [selectedTrainingTitle, setSelectedTrainingTitle] = useState<string>('');

  // --- INITIAL LOAD ---
  useEffect(() => {
    loadTrainings();
    loadOfficers();
  }, []);

  const loadTrainings = async () => {
    try {
      const { data: trainingsData, error } = await api.getTrainingsWithMetrics();
      if (error) throw error;

      const trainingsWithCounts = (trainingsData || []).map(training => ({
        ...training,
        time: training.time || null,
        registered: parseInt(training.registered) || 0
      }));
      setTrainings(trainingsWithCounts);
    } catch (error) {
      console.error('Error loading trainings:', error);
      toast({ title: "Error", description: "Failed to load trainings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadOfficers = async () => {
    try {
      const { data, error } = await api.getProfiles();
      if (error) throw error;
      const officerProfiles = (data || []).filter(profile => profile.role === 'officer');
      setOfficers(officerProfiles);
    } catch (error) {
      console.error('Error loading officers:', error);
    }
  };

  // --- CALENDAR LOGIC ---
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  };

  // --- FORM HANDLERS ---
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
      status: 'upcoming',
      target_positions: []
    });
    setCreateDialogOpen(false);
    setEditingTraining(null);
  };

  const generateTrainingId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TRN-${timestamp}-${random}`;
  };

  const handleDayClick = (day: Date) => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    setFormData(prev => ({ ...prev, start_date: formattedDate, date: formattedDate }));
    setEditingTraining(null); // Ensure we are creating new
    setCreateDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date || !formData.venue) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      const currentUserId = localStorage.getItem('userId'); // Log ID

      if (editingTraining) {
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
          target_positions: formData.target_positions,
          updated_by: currentUserId
        });
        if (error) throw error;
        toast({ title: "Success", description: "Training updated successfully" });
      } else {
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
          status: formData.status,
          target_positions: formData.target_positions,
          created_by: currentUserId
        });
        if (error) throw error;
        toast({ title: "Success", description: "Training created successfully" });
      }

      resetForm();
      loadTrainings();
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: "Error", description: "Failed to save training", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this training?")) return;
    try {
      const { error } = await api.deleteTraining(id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Training deleted successfully" });
      setCreateDialogOpen(false); // Close dialog if open
      loadTrainings();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleEdit = (training: TrainingWithRegistrations, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering day click
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
      status: training.status,
      target_positions: Array.isArray(training.target_positions) ? training.target_positions : []
    });
    setEditingTraining(training);
    setCreateDialogOpen(true);
  };

  const handleViewEnrolled = async (trainingId: string) => {
    try {
      const { data: registrations } = await api.getTrainingRegistrationsByTraining(trainingId);
      const { data: companions } = await api.getCompanionRegistrationsByTraining(trainingId);
      const { data: attendanceDocs } = await api.getAttendance(); // Fetch all attendances and filter locally for now since we don't have a by-training endpoint

      const enrolledData = (registrations || []).map(registration => ({
        ...registration,
        type: 'officer',
        companions: (companions || []).filter(c => c.officer_id === registration.officer_id)
      }));

      const relatedAttendance = (attendanceDocs || []).filter(a => a.training_id === trainingId);

      setSelectedTrainingEnrollments(enrolledData);
      setSelectedTrainingAttendance(relatedAttendance);
    } catch (error) {
      console.error('Error loading enrolled:', error);
    }
  };

  const handleMarkAttendance = async (officerId: string, currentStatus: boolean) => {
    if (!selectedTrainingId) return;
    try {
      if (!currentStatus) {
        // Mark as attended
        const currentUserId = localStorage.getItem('userId') || 'system';
        const { error } = await api.recordAttendance({
          officer_id: officerId,
          training_id: selectedTrainingId,
          recorded_by: currentUserId,
          method: 'manual',
          check_in_time: new Date().toISOString()
        });
        if (error) throw error;
        toast({ title: "Checked In", description: "Officer marked as attended" });
      } else {
        // Future enhancement: remove attendance if toggled off
        toast({ title: "Already Checked In", description: "Attendance cannot be revoked manually at this time." });
      }
      // Refresh the view
      handleViewEnrolled(selectedTrainingId);
    } catch (error) {
      toast({ title: "Error", description: "Failed to record attendance", variant: "destructive" });
    }
  };

  const handleEnrollOfficer = async (officerId: string) => {
    if (!selectedTrainingId) return;
    try {
      const { error } = await api.createTrainingRegistration({ training_id: selectedTrainingId, officer_id: officerId });
      if (error) throw error;
      toast({ title: "Success", description: "Officer enrolled" });
      setEnrollmentDialogOpen(false);
      loadTrainings();
    } catch (error) {
      toast({ title: "Error", description: "Failed to enroll officer", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
    }
  };

  // --- RENDER HELPERS ---
  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const availablePositions = Array.from(new Set(officers.map(o => o.position).filter(Boolean))) as string[];

  const currentEnrollmentTraining = trainings.find(t => t.id === selectedTrainingId);
  const targetPositionsList = currentEnrollmentTraining?.target_positions || [];
  const eligibleOfficers = officers.filter(o => o.position && targetPositionsList.includes(o.position));
  const otherOfficers = officers.filter(o => !o.position || !targetPositionsList.includes(o.position));

  const handleBulkEnroll = async (officersToEnroll: Officer[]) => {
    if (!selectedTrainingId) return;
    try {
      await Promise.all(officersToEnroll.map(off =>
        api.createTrainingRegistration({ training_id: selectedTrainingId, officer_id: off.id })
      ));
      toast({ title: "Success", description: "Bulk enrollment completed" });
      setEnrollmentDialogOpen(false);
      loadTrainings();
    } catch (error) {
      toast({ title: "Warning", description: "Some enrollments may have failed (e.g., they might be already enrolled).", variant: "destructive" });
      loadTrainings();
    }
  };

  return (
    <DashboardLayout title="Training Management" description="Manage schedules and track officer compliance">
      <div className="p-6 h-[calc(100vh-100px)] flex flex-col">
        <Tabs defaultValue="calendar" className="h-full flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="calendar">Training Calendar</TabsTrigger>
              <TabsTrigger value="compliance">Officer Compliance</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar" className="flex-1 flex flex-col overflow-hidden mt-0">
            {/* HEADER & CONTROLS */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                  <CalendarIcon className="h-8 w-8 text-blue-600" />
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center bg-white rounded-md border shadow-sm">
                  <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="ghost" className="px-4 font-medium" onClick={goToToday}>Today</Button>
                  <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>

              <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Schedule Training
              </Button>
            </div>

            {/* CALENDAR GRID */}
            {loading ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <div className="flex-1 border rounded-lg shadow-sm bg-white overflow-hidden flex flex-col">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b bg-gray-50">
                  {weekDays.map(day => (
                    <div key={day} className="py-2 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-200 gap-px">
                  {days.map((day, idx) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);

                    // Find trainings for this day
                    const dayTrainings = trainings.filter(t => isSameDay(parseISO(t.start_date), day));

                    return (
                      <div
                        key={idx}
                        onClick={() => handleDayClick(day)}
                        className={`min-h-[100px] bg-white p-2 flex flex-col gap-1 cursor-pointer transition-colors hover:bg-gray-50
                      ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                      ${isTodayDate ? 'bg-blue-50/50' : ''}
                    `}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`
                        text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full
                        ${isTodayDate ? 'bg-blue-600 text-white' : ''}
                      `}>
                            {format(day, 'd')}
                          </span>
                        </div>

                        {/* Events List */}
                        <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[80px]">
                          {dayTrainings.map(training => (
                            <div
                              key={training.id}
                              className={`
                            text-xs p-1.5 rounded border mb-1 cursor-pointer shadow-sm
                            ${getStatusColor(training.status)}
                          `}
                              onClick={(e) => handleEdit(training, e)}
                            >
                              <div className="flex items-center justify-between overflow-hidden">
                                <span className="truncate">
                                  {training.target_positions && training.target_positions.length > 0 && (
                                    <span className="text-[10px] mr-1 px-1 bg-primary text-primary-foreground rounded-sm">
                                      Targeted
                                    </span>
                                  )}
                                  {training.time && <span className="opacity-75 mr-1">{training.time.slice(0, 5)}</span>}
                                  {training.title}
                                </span>
                                <button
                                  className="ml-1 p-0.5 hover:bg-black/10 rounded-full shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTrainingId(training.id);
                                    setSelectedTrainingTitle(training.title);
                                    handleViewEnrolled(training.id);
                                    setViewEnrolledDialogOpen(true);
                                  }}
                                  title="View Attendees"
                                >
                                  <Users className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- DIALOGS (Hidden) --- */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTraining ? 'Edit Training Event' : 'Schedule Training'}</DialogTitle>
                  <DialogDescription>{editingTraining ? 'Update details below.' : 'Click save to add to calendar.'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Training Title" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Topic</Label>
                      <Select value={formData.topic} onValueChange={(val) => setFormData({ ...formData, topic: val })}>
                        <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Governance">Governance</SelectItem>
                          <SelectItem value="Financial Management">Financial Management</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Leadership">Leadership</SelectItem>
                          <SelectItem value="Risk Management">Risk Management</SelectItem>
                          <SelectItem value="Compliance">Compliance</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value, date: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} placeholder="Optional" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Speaker</Label>
                      <Input value={formData.speaker} onChange={e => setFormData({ ...formData, speaker: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <Input value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} placeholder="Location" required />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Target Positions (Optional)</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {availablePositions.map(pos => {
                        const isSelected = formData.target_positions.includes(pos);
                        return (
                          <Badge
                            key={pos}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer ${isSelected ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-100'}`}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                target_positions: isSelected
                                  ? prev.target_positions.filter(p => p !== pos)
                                  : [...prev.target_positions, pos]
                              }));
                            }}
                          >
                            {pos}
                          </Badge>
                        );
                      })}
                      {availablePositions.length === 0 && <span className="text-sm text-gray-500">No positions found in roster.</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Capacity</Label>
                      <Input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="ongoing">Ongoing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    {editingTraining && (
                      <div className="flex gap-2">
                        <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(editingTraining.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          setSelectedTrainingId(editingTraining.id);
                          setSelectedTrainingTitle(editingTraining.title);
                          handleViewEnrolled(editingTraining.id);
                          setViewEnrolledDialogOpen(true);
                        }}>
                          <Users className="h-4 w-4 mr-2" /> View Attendees
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          setSelectedTrainingId(editingTraining.id);
                          setEnrollmentDialogOpen(true);
                        }}>
                          <UserPlus className="h-4 w-4 mr-2" /> Enroll
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2 ml-auto">
                      <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Event</Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Enrollment & View Dialogs (Simpler rendering for brevity, functionality preserved) */}
            <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>Enroll Officer</DialogTitle></DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">

                  {targetPositionsList.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-blue-50 p-2 rounded-md">
                        <h4 className="font-semibold text-blue-800 text-sm">Eligible Officers (Targeted Roles)</h4>
                        <Button size="sm" onClick={() => handleBulkEnroll(eligibleOfficers)} disabled={eligibleOfficers.length === 0} className="bg-blue-600 hover:bg-blue-700">
                          Bulk Enroll Eligible
                        </Button>
                      </div>
                      {eligibleOfficers.length === 0 ? <p className="text-xs text-gray-500 pl-2">No matching officers found.</p> :
                        eligibleOfficers.map(officer => (
                          <div key={officer.id} className="flex justify-between items-center p-2 border border-blue-100 bg-blue-50/30 rounded">
                            <div>
                              <p className="font-medium text-sm">{officer.full_name}</p>
                              <p className="text-xs text-gray-500">{officer.position} • {officer.cooperative}</p>
                            </div>
                            <Button size="sm" variant="outline" className="border-blue-200 hover:bg-blue-100" onClick={() => handleEnrollOfficer(officer.id)}>Enroll</Button>
                          </div>
                        ))
                      }
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700 text-sm pl-1">{targetPositionsList.length > 0 ? "Other Officers" : "All Officers"}</h4>
                    {otherOfficers.map(officer => (
                      <div key={officer.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{officer.full_name}</p>
                          <p className="text-xs text-gray-500">{officer.position || 'No Position'} • {officer.cooperative || 'No Coop'}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleEnrollOfficer(officer.id)}>Enroll</Button>
                      </div>
                    ))}
                  </div>

                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={viewEnrolledDialogOpen} onOpenChange={setViewEnrolledDialogOpen}>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>Attendees: {selectedTrainingTitle}</DialogTitle></DialogHeader>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(!selectedTrainingEnrollments || selectedTrainingEnrollments.length === 0) ? <p className="text-gray-500">No attendees yet.</p> :
                    selectedTrainingEnrollments.map(att => {
                      const isAttended = (selectedTrainingAttendance || []).some(a => a.officer_id === att?.officer_id);
                      return (
                        <div key={att.id} className="p-3 border rounded bg-white flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-medium text-sm">{att.full_name || att.officer_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" /> {att.cooperative || ''}  | {att.position || ''}
                            </p>
                          </div>
                          <div>
                            {isAttended ? (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-700 pointer-events-none">
                                <CheckCircle className="h-3 w-3 mr-1" /> Attended
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-blue-200 hover:bg-blue-50 text-blue-700"
                                onClick={() => handleMarkAttendance(att.officer_id, false)}
                              >
                                Mark Attended
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="compliance">
            <OfficerCompliance />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TrainingManagement;