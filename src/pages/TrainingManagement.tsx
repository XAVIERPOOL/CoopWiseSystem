import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Calendar as CalendarIcon,
  LayoutList,
  LayoutGrid,
  TrendingUp,
  BookOpen,
  DollarSign,
  Shield,
  Star,
  AlertTriangle,
  CheckSquare,
  Mic,
  CalendarDays,
  BarChart3,
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
  isWithinInterval,
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

// --- TOPIC CONFIG ---
const TOPIC_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  'Governance':          { icon: <Shield className="h-3.5 w-3.5" />,        color: 'text-indigo-700',  bg: 'bg-indigo-50',   border: 'border-indigo-200' },
  'Financial Management':{ icon: <DollarSign className="h-3.5 w-3.5" />,    color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  'Marketing':           { icon: <TrendingUp className="h-3.5 w-3.5" />,     color: 'text-orange-700',  bg: 'bg-orange-50',   border: 'border-orange-200' },
  'Leadership':          { icon: <Star className="h-3.5 w-3.5" />,           color: 'text-purple-700',  bg: 'bg-purple-50',   border: 'border-purple-200' },
  'Risk Management':     { icon: <AlertTriangle className="h-3.5 w-3.5" />,  color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200' },
  'Compliance':          { icon: <CheckSquare className="h-3.5 w-3.5" />,    color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200' },
  'Other':               { icon: <BookOpen className="h-3.5 w-3.5" />,       color: 'text-gray-700',    bg: 'bg-gray-50',     border: 'border-gray-200' },
};

const getTopicConfig = (topic: string) =>
  TOPIC_CONFIG[topic] ?? TOPIC_CONFIG['Other'];

// Status pill for calendar chips
const STATUS_CHIP: Record<string, string> = {
  upcoming:  'bg-amber-50  text-amber-800  border-amber-200',
  ongoing:   'bg-blue-50   text-blue-800   border-blue-200',
  completed: 'bg-green-50  text-green-800  border-green-200',
};

// Left-border accent for list cards
const STATUS_BORDER: Record<string, string> = {
  upcoming:  'border-l-amber-400',
  ongoing:   'border-l-blue-500',
  completed: 'border-l-green-500',
};

const TrainingManagement = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
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
    target_positions: [] as string[],
  });

  const [trainings, setTrainings] = useState<TrainingWithRegistrations[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [listSearch, setListSearch] = useState('');
  const [listFilter, setListFilter] = useState<string>('all');

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
        registered: parseInt(training.registered) || 0,
      }));
      setTrainings(trainingsWithCounts);
    } catch (error) {
      console.error('Error loading trainings:', error);
      toast({ title: 'Error', description: 'Failed to load trainings', variant: 'destructive' });
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

  // --- STATS ---
  const stats = useMemo(() => ({
    upcoming:  trainings.filter(t => t.status === 'upcoming').length,
    ongoing:   trainings.filter(t => t.status === 'ongoing').length,
    completed: trainings.filter(t => t.status === 'completed').length,
    enrolled:  trainings.reduce((sum, t) => sum + (t.registered || 0), 0),
  }), [trainings]);

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
      target_positions: [],
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
    setEditingTraining(null);
    setCreateDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date || !formData.venue) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    try {
      const currentUserId = localStorage.getItem('userId');
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
          updated_by: currentUserId,
        });
        if (error) throw error;
        toast({ title: 'Success', description: 'Training updated successfully' });
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
          created_by: currentUserId,
        });
        if (error) throw error;
        toast({ title: 'Success', description: 'Training scheduled successfully' });
      }
      resetForm();
      loadTrainings();
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Error', description: 'Failed to save training', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this training?')) return;
    try {
      const { error } = await api.deleteTraining(id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Training deleted successfully' });
      setCreateDialogOpen(false);
      loadTrainings();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleEdit = (training: TrainingWithRegistrations, e: React.MouseEvent) => {
    e.stopPropagation();
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
      target_positions: Array.isArray(training.target_positions) ? training.target_positions : [],
    });
    setEditingTraining(training);
    setCreateDialogOpen(true);
  };

  const handleViewEnrolled = async (trainingId: string) => {
    try {
      const { data: registrations } = await api.getTrainingRegistrationsByTraining(trainingId);
      const { data: companions } = await api.getCompanionRegistrationsByTraining(trainingId);
      const { data: attendanceDocs } = await api.getAttendance();
      const enrolledData = (registrations || []).map(registration => ({
        ...registration,
        type: 'officer',
        companions: (companions || []).filter(c => c.officer_id === registration.officer_id),
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
        const currentUserId = localStorage.getItem('userId') || 'system';
        const { error } = await api.recordAttendance({
          officer_id: officerId,
          training_id: selectedTrainingId,
          recorded_by: currentUserId,
          method: 'manual',
          check_in_time: new Date().toISOString(),
        });
        if (error) throw error;
        toast({ title: 'Checked In', description: 'Officer marked as attended' });
      } else {
        toast({ title: 'Already Checked In', description: 'Attendance cannot be revoked manually at this time.' });
      }
      handleViewEnrolled(selectedTrainingId);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to record attendance', variant: 'destructive' });
    }
  };

  const handleEnrollOfficer = async (officerId: string) => {
    if (!selectedTrainingId) return;
    try {
      const { error } = await api.createTrainingRegistration({ training_id: selectedTrainingId, officer_id: officerId });
      if (error) throw error;
      toast({ title: 'Success', description: 'Officer enrolled' });
      setEnrollmentDialogOpen(false);
      loadTrainings();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to enroll officer', variant: 'destructive' });
    }
  };

  const handleBulkEnroll = async (officersToEnroll: Officer[]) => {
    if (!selectedTrainingId) return;
    try {
      await Promise.all(officersToEnroll.map(off =>
        api.createTrainingRegistration({ training_id: selectedTrainingId, officer_id: off.id })
      ));
      toast({ title: 'Success', description: 'Bulk enrollment completed' });
      setEnrollmentDialogOpen(false);
      loadTrainings();
    } catch (error) {
      toast({ title: 'Warning', description: 'Some enrollments may have failed.', variant: 'destructive' });
      loadTrainings();
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

  // List view filtered trainings
  const filteredListTrainings = useMemo(() => {
    return trainings
      .filter(t => {
        const matchesSearch =
          t.title.toLowerCase().includes(listSearch.toLowerCase()) ||
          t.venue.toLowerCase().includes(listSearch.toLowerCase()) ||
          (t.speaker || '').toLowerCase().includes(listSearch.toLowerCase());
        const matchesFilter = listFilter === 'all' || t.status === listFilter;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [trainings, listSearch, listFilter]);

  const isTrainingOnDay = (training: TrainingWithRegistrations, day: Date): boolean => {
    try {
      const start = parseISO(training.start_date);
      if (training.end_date) {
        const end = parseISO(training.end_date);
        return isWithinInterval(day, { start, end });
      }
      return isSameDay(start, day);
    } catch {
      return false;
    }
  };

  const isTrainingStart = (training: TrainingWithRegistrations, day: Date): boolean => {
    try { return isSameDay(parseISO(training.start_date), day); } catch { return false; }
  };

  return (
    <DashboardLayout title="Training Management" description="Manage schedules and track officer compliance">
      <div className="p-6 space-y-6">

        {/* ── STATS BANNER ── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e293b] via-[#1e3a5f] to-[#164e8e] text-white shadow-lg p-6">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 0%, transparent 60%)' }} />
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20 shadow-inner">
                <CalendarIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Training Calendar</h2>
                <p className="text-blue-200/80 text-sm font-medium mt-0.5">Naga City · Camarines Sur · Region V</p>
              </div>
            </div>
            <Button
              onClick={() => { resetForm(); setCreateDialogOpen(true); }}
              className="bg-white text-[#1e293b] hover:bg-blue-50 font-bold shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" /> Schedule Training
            </Button>
          </div>

          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Upcoming',  value: stats.upcoming,  icon: <CalendarDays className="h-4 w-4 text-white/70" /> },
              { label: 'Ongoing',   value: stats.ongoing,   icon: <Clock className="h-4 w-4 text-white/70" /> },
              { label: 'Completed', value: stats.completed, icon: <CheckCircle className="h-4 w-4 text-white/70" /> },
              { label: 'Enrolled',  value: stats.enrolled,  icon: <Users className="h-4 w-4 text-white/70" /> },
            ].map(s => (
              <div key={s.label} className="text-left p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  {s.icon}
                  <span className="text-2xl font-extrabold text-white">{s.value}</span>
                </div>
                <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <Tabs defaultValue="calendar" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <TabsList>
              <TabsTrigger value="calendar">Training Calendar</TabsTrigger>
              <TabsTrigger value="compliance">Officer Compliance</TabsTrigger>
            </TabsList>

            {/* Calendar vs List toggle (only relevant on the calendar tab) */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid className="h-4 w-4" /> Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutList className="h-4 w-4" /> List
              </button>
            </div>
          </div>

          {/* ── CALENDAR / LIST TAB ── */}
          <TabsContent value="calendar" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : viewMode === 'calendar' ? (

              /* ── CALENDAR VIEW ── */
              <div className="space-y-4">
                {/* Month nav */}
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-800">
                    {format(currentDate, 'MMMM yyyy')}
                  </h2>
                  <div className="flex items-center bg-white rounded-lg border shadow-sm">
                    <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="ghost" className="px-3 text-sm font-semibold" onClick={goToToday}>Today</Button>
                    <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 border-b bg-gray-50">
                    {weekDays.map(day => (
                      <div key={day} className="py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 auto-rows-fr bg-gray-100 gap-px">
                    {days.map((day, idx) => {
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isTodayDate = isToday(day);
                      const dayTrainings = trainings.filter(t => isTrainingOnDay(t, day));

                      return (
                        <div
                          key={idx}
                          onClick={() => handleDayClick(day)}
                          className={`group min-h-[110px] bg-white p-2 flex flex-col gap-1 cursor-pointer transition-colors hover:bg-blue-50/30
                            ${!isCurrentMonth ? 'bg-gray-50/80 text-gray-400' : ''}
                            ${isTodayDate ? 'bg-blue-50/40' : ''}
                          `}
                        >
                          <div className="flex justify-between items-start">
                            <span className={`text-sm font-semibold h-7 w-7 flex items-center justify-center rounded-full
                              ${isTodayDate ? 'bg-blue-600 text-white shadow-md' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
                            `}>
                              {format(day, 'd')}
                            </span>
                            {/* Faint "+" hint on empty days */}
                            {dayTrainings.length === 0 && isCurrentMonth && (
                              <span className="opacity-0 group-hover:opacity-40 transition-opacity text-gray-400 text-lg leading-none select-none">+</span>
                            )}
                          </div>

                          {/* Training chips */}
                          <div className="flex flex-col gap-1 mt-0.5 overflow-y-auto max-h-[80px]">
                            {dayTrainings.map(training => {
                              const chipColor = STATUS_CHIP[training.status] ?? STATUS_CHIP['upcoming'];
                              const tc = getTopicConfig(training.topic);
                              const isStart = isTrainingStart(training, day);
                              const fillPct = training.capacity > 0
                                ? Math.min(100, Math.round((training.registered / training.capacity) * 100))
                                : 0;
                              return (
                                <div
                                  key={training.id}
                                  className={`text-xs px-1.5 py-1 rounded-md border cursor-pointer transition-all hover:brightness-95 shadow-sm ${chipColor}
                                    ${!isStart ? 'opacity-60' : ''}
                                  `}
                                  onClick={e => handleEdit(training, e)}
                                  title={training.title}
                                >
                                  <div className="flex items-center gap-1 overflow-hidden">
                                    <span className={`shrink-0 ${tc.color}`}>{tc.icon}</span>
                                    <span className="truncate font-semibold flex-1">{training.title}</span>
                                    <button
                                      className="ml-auto shrink-0 hover:scale-110 transition-transform"
                                      onClick={e => {
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
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {training.time && (
                                      <span className="opacity-70 flex items-center gap-0.5">
                                        <Clock className="h-2.5 w-2.5" />
                                        {training.time.slice(0, 5)}
                                      </span>
                                    )}
                                    <span className="ml-auto opacity-75 font-medium tabular-nums">
                                      {training.registered}/{training.capacity}
                                    </span>
                                  </div>
                                  {/* Thin capacity bar */}
                                  <div className="mt-1 h-[3px] rounded-full bg-black/10 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${fillPct >= 90 ? 'bg-red-500' : fillPct >= 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                                      style={{ width: `${fillPct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            ) : (

              /* ── LIST VIEW ── */
              <div className="space-y-4">
                {/* List filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Search by title, venue or speaker..."
                      value={listSearch}
                      onChange={e => setListSearch(e.target.value)}
                    />
                    <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                  </div>
                  <Select value={listFilter} onValueChange={setListFilter}>
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredListTrainings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <CalendarIcon className="h-12 w-12 mb-3 opacity-30" />
                    <p className="font-semibold">No trainings found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredListTrainings.map(training => {
                      const tc = getTopicConfig(training.topic);
                      const borderAccent = STATUS_BORDER[training.status] ?? 'border-l-gray-300';
                      const fillPct = training.capacity > 0
                        ? Math.min(100, Math.round((training.registered / training.capacity) * 100))
                        : 0;
                      return (
                        <Card
                          key={training.id}
                          className={`bg-white shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 border-l-4 ${borderAccent} group`}
                        >
                          <CardContent className="p-4 space-y-3">
                            {/* Top row: topic badge + status badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${tc.color} ${tc.bg} ${tc.border}`}>
                                {tc.icon} {training.topic || 'General'}
                              </span>
                              <Badge className={`text-[11px] capitalize ${STATUS_CHIP[training.status] ?? ''}`}>
                                {training.status}
                              </Badge>
                              {training.target_positions && training.target_positions.length > 0 && (
                                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/5">
                                  Targeted
                                </Badge>
                              )}
                              <span className="ml-auto text-[10px] text-gray-400 font-mono">{training.training_id}</span>
                            </div>

                            {/* Title */}
                            <h3 className="font-bold text-gray-900 text-[15px] leading-snug group-hover:text-blue-700 transition-colors">
                              {training.title}
                            </h3>

                            {/* Key info */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span>{format(parseISO(training.start_date), 'MMM d, yyyy')}
                                  {training.end_date && training.end_date !== training.start_date
                                    ? ` – ${format(parseISO(training.end_date), 'MMM d')}`
                                    : ''}
                                </span>
                              </div>
                              {training.time && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                  <span>{training.time.slice(0, 5)}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">{training.venue}</span>
                              </div>
                              {training.speaker && (
                                <div className="flex items-center gap-1.5">
                                  <Mic className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                  <span className="truncate">{training.speaker}</span>
                                </div>
                              )}
                            </div>

                            {/* Capacity bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                                <span className="flex items-center gap-1">
                                  <BarChart3 className="h-3 w-3" /> Enrollment
                                </span>
                                <span className={`${fillPct >= 90 ? 'text-red-600' : fillPct >= 60 ? 'text-amber-600' : 'text-green-600'}`}>
                                  {training.registered} / {training.capacity}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${fillPct >= 90 ? 'bg-red-500' : fillPct >= 60 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                  style={{ width: `${fillPct}%` }}
                                />
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 pt-1 border-t border-gray-100">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-8 text-xs font-semibold"
                                onClick={e => handleEdit(training, e)}
                              >
                                <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-8 text-xs font-semibold"
                                onClick={() => {
                                  setSelectedTrainingId(training.id);
                                  setSelectedTrainingTitle(training.title);
                                  handleViewEnrolled(training.id);
                                  setViewEnrolledDialogOpen(true);
                                }}
                              >
                                <Users className="h-3.5 w-3.5 mr-1" /> Attendees
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => {
                                  setSelectedTrainingId(training.id);
                                  setEnrollmentDialogOpen(true);
                                }}
                              >
                                <UserPlus className="h-3.5 w-3.5 mr-1" /> Enroll
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── DIALOGS ── */}

            {/* Create / Edit Training */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTraining ? 'Edit Training Event' : 'Schedule New Training'}</DialogTitle>
                  <DialogDescription>{editingTraining ? 'Update details below.' : 'Fill in the details to add to the calendar.'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                  {/* Section: Basic Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Basic Info</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 col-span-2">
                        <Label>Title <span className="text-red-500">*</span></Label>
                        <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Cooperative Governance Seminar" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Topic</Label>
                        <Select value={formData.topic} onValueChange={val => setFormData({ ...formData, topic: val })}>
                          <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(TOPIC_CONFIG).map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
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
                  </div>

                  {/* Section: Schedule */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Schedule & Location</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Start Date <span className="text-red-500">*</span></Label>
                        <Input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value, date: e.target.value })} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>End Date</Label>
                        <Input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Time</Label>
                        <Input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Capacity</Label>
                        <Input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} placeholder="30" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label>Venue <span className="text-red-500">*</span></Label>
                        <Input value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} placeholder="e.g. Naga City Convention Center" required />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label>Speaker</Label>
                        <Input value={formData.speaker} onChange={e => setFormData({ ...formData, speaker: e.target.value })} placeholder="e.g. Dr. John Dela Cruz" />
                      </div>
                    </div>
                  </div>

                  {/* Section: Target Positions */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target Positions (Optional)</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {availablePositions.map(pos => {
                        const isSelected = formData.target_positions.includes(pos);
                        return (
                          <Badge
                            key={pos}
                            variant={isSelected ? 'default' : 'outline'}
                            className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-100'}`}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                target_positions: isSelected
                                  ? prev.target_positions.filter(p => p !== pos)
                                  : [...prev.target_positions, pos],
                              }));
                            }}
                          >
                            {pos}
                          </Badge>
                        );
                      })}
                      {availablePositions.length === 0 && <span className="text-sm text-gray-400">No officer positions found in roster.</span>}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    {editingTraining && (
                      <div className="flex gap-2">
                        <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(editingTraining.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          setSelectedTrainingId(editingTraining.id);
                          setSelectedTrainingTitle(editingTraining.title);
                          handleViewEnrolled(editingTraining.id);
                          setViewEnrolledDialogOpen(true);
                        }}>
                          <Users className="h-4 w-4 mr-1" /> Attendees
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          setSelectedTrainingId(editingTraining.id);
                          setEnrollmentDialogOpen(true);
                        }}>
                          <UserPlus className="h-4 w-4 mr-1" /> Enroll
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2 ml-auto">
                      <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Training</Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Enrollment Dialog */}
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
                              <p className="text-xs text-gray-500">{officer.position} · {officer.cooperative}</p>
                            </div>
                            <Button size="sm" variant="outline" className="border-blue-200 hover:bg-blue-100" onClick={() => handleEnrollOfficer(officer.id)}>Enroll</Button>
                          </div>
                        ))
                      }
                    </div>
                  )}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700 text-sm pl-1">{targetPositionsList.length > 0 ? 'Other Officers' : 'All Officers'}</h4>
                    {otherOfficers.map(officer => (
                      <div key={officer.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{officer.full_name}</p>
                          <p className="text-xs text-gray-500">{officer.position || 'No Position'} · {officer.cooperative || 'No Coop'}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleEnrollOfficer(officer.id)}>Enroll</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* View Attendees Dialog */}
            <Dialog open={viewEnrolledDialogOpen} onOpenChange={setViewEnrolledDialogOpen}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Attendees: {selectedTrainingTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(!selectedTrainingEnrollments || selectedTrainingEnrollments.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                      <Users className="h-8 w-8 mb-2 opacity-30" />
                      <p className="text-sm font-medium">No attendees yet.</p>
                    </div>
                  ) : selectedTrainingEnrollments.map(att => {
                    const isAttended = (selectedTrainingAttendance || []).some(a => a.officer_id === att?.officer_id);
                    return (
                      <div key={att.id} className="p-3 border rounded-lg bg-white flex justify-between items-center shadow-sm hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-semibold text-sm">{att.full_name || att.officer_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {att.cooperative || ''} {att.position ? `| ${att.position}` : ''}
                          </p>
                        </div>
                        <div>
                          {isAttended ? (
                            <Badge className="bg-green-600 hover:bg-green-600 pointer-events-none gap-1">
                              <CheckCircle className="h-3 w-3" /> Attended
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
                    );
                  })}
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