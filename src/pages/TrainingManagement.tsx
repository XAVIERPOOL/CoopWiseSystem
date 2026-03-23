import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus, MapPin, Users, Clock, Edit3, Trash2, Eye, UserPlus, Loader2, ChevronLeft, ChevronRight,
  CheckCircle, Calendar as CalendarIcon, LayoutList, LayoutGrid, TrendingUp, BookOpen,
  DollarSign, Shield, Star, AlertTriangle, CheckSquare, Mic, CalendarDays, BarChart3, ArrowRight
} from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, isWithinInterval,
} from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OfficerCompliance from '@/components/OfficerCompliance';

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

const TOPIC_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  'Governance':          { icon: <Shield className="h-4 w-4" />,        color: 'text-indigo-500',  bg: 'bg-indigo-500/10',   border: 'border-indigo-500/20' },
  'Financial Management':{ icon: <DollarSign className="h-4 w-4" />,    color: 'text-emerald-500', bg: 'bg-emerald-500/10',  border: 'border-emerald-500/20' },
  'Marketing':           { icon: <TrendingUp className="h-4 w-4" />,     color: 'text-orange-500',  bg: 'bg-orange-500/10',   border: 'border-orange-500/20' },
  'Leadership':          { icon: <Star className="h-4 w-4" />,           color: 'text-purple-500',  bg: 'bg-purple-500/10',   border: 'border-purple-500/20' },
  'Risk Management':     { icon: <AlertTriangle className="h-4 w-4" />,  color: 'text-red-500',     bg: 'bg-red-500/10',      border: 'border-red-500/20' },
  'Compliance':          { icon: <CheckSquare className="h-4 w-4" />,    color: 'text-blue-500',    bg: 'bg-blue-500/10',     border: 'border-blue-500/20' },
  'Other':               { icon: <BookOpen className="h-4 w-4" />,       color: 'text-gray-500',    bg: 'bg-gray-500/10',     border: 'border-gray-500/20' },
};

const getTopicConfig = (topic: string) => TOPIC_CONFIG[topic] ?? TOPIC_CONFIG['Other'];

const STATUS_CHIP: Record<string, string> = {
  upcoming:  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  ongoing:   'bg-blue-500/10  text-blue-600 dark:text-blue-400 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
};

// Framer Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const TrainingManagement = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<TrainingWithRegistrations | null>(null);
  const [loading, setLoading] = useState(true);

  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    training_id: '', title: '', topic: '', date: '', start_date: '',
    end_date: '', time: '', venue: '', capacity: '', speaker: '',
    status: 'upcoming', target_positions: [] as string[],
  });

  const [trainings, setTrainings] = useState<TrainingWithRegistrations[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [listSearch, setListSearch] = useState('');
  const [listFilter, setListFilter] = useState<string>('all');

  const [selectedTrainingEnrollments, setSelectedTrainingEnrollments] = useState<any[]>([]);
  const [selectedTrainingAttendance, setSelectedTrainingAttendance] = useState<any[]>([]);
  const [viewEnrolledDialogOpen, setViewEnrolledDialogOpen] = useState(false);
  const [selectedTrainingTitle, setSelectedTrainingTitle] = useState<string>('');

  useEffect(() => {
    loadTrainings();
    loadOfficers();
  }, []);

  const loadTrainings = async () => {
    try {
      const { data, error } = await api.getTrainingsWithMetrics();
      if (error) throw error;
      setTrainings((data || []).map(training => ({ ...training, time: training.time || null, registered: parseInt(training.registered) || 0 })));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load trainings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadOfficers = async () => {
    try {
      const { data } = await api.getProfiles();
      setOfficers((data || []).filter(profile => profile.role === 'officer'));
    } catch (error) {}
  };

  const stats = useMemo(() => ({
    upcoming: trainings.filter(t => t.status === 'upcoming').length,
    ongoing: trainings.filter(t => t.status === 'ongoing').length,
    completed: trainings.filter(t => t.status === 'completed').length,
    enrolled: trainings.reduce((sum, t) => sum + (t.registered || 0), 0),
  }), [trainings]);

  const getDaysInMonth = () => eachDayOfInterval({ start: startOfWeek(startOfMonth(currentDate)), end: endOfWeek(endOfMonth(currentDate)) });

  const resetForm = () => {
    setFormData({
      training_id: '', title: '', topic: '', date: '', start_date: '',
      end_date: '', time: '', venue: '', capacity: '', speaker: '',
      status: 'upcoming', target_positions: [],
    });
    setCreateDialogOpen(false);
    setEditingTraining(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date || !formData.venue) {
      toast({ title: 'Validation Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    // Duplicate Check Safeguard
    if (!editingTraining) {
      const isDuplicate = trainings.some(t => 
        t.title.toLowerCase().trim() === formData.title.toLowerCase().trim() && 
        t.start_date === formData.start_date
      );
      if (isDuplicate) {
        toast({ title: 'Duplicate Prevention', description: 'A training with this identical title is already scheduled on this exactly date!', variant: 'destructive' });
        return;
      }
    }

    try {
      const payload = {
        title: formData.title, topic: formData.topic, date: formData.start_date, start_date: formData.start_date,
        end_date: formData.end_date || null, time: formData.time || null, venue: formData.venue,
        capacity: parseInt(formData.capacity) || 30, speaker: formData.speaker, status: formData.status,
        target_positions: formData.target_positions,
      };

      if (editingTraining) {
        await api.updateTraining(editingTraining.id, payload);
        toast({ title: 'Success', description: 'Training updated beautifully' });
      } else {
        await api.createTraining({ training_id: `TRN-${Date.now().toString().slice(-6)}`, ...payload });
        toast({ title: 'Success', description: 'Training successfully scheduled' });
      }
      resetForm();
      loadTrainings();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save training', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you certain? This action cannot be undone.')) return;
    try {
      await api.deleteTraining(id);
      toast({ title: 'Deleted', description: 'Training completely removed' });
      setCreateDialogOpen(false);
      loadTrainings();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleEdit = (training: TrainingWithRegistrations, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({
      training_id: training.training_id, title: training.title, topic: training.topic, date: training.date,
      start_date: training.start_date, end_date: training.end_date || '', time: training.time || '',
      venue: training.venue, capacity: training.capacity.toString(), speaker: training.speaker,
      status: training.status, target_positions: Array.isArray(training.target_positions) ? training.target_positions : [],
    });
    setEditingTraining(training);
    setCreateDialogOpen(true);
  };

  const handleViewEnrolled = async (trainingId: string) => {
    try {
      const [{ data: regs }, { data: comps }, { data: attds }] = await Promise.all([
        api.getTrainingRegistrationsByTraining(trainingId),
        api.getCompanionRegistrationsByTraining(trainingId),
        api.getAttendance()
      ]);
      const mapped = (regs || []).map(r => ({ ...r, type: 'officer', companions: (comps || []).filter(c => c.officer_id === r.officer_id) }));
      setSelectedTrainingEnrollments(mapped);
      setSelectedTrainingAttendance((attds || []).filter(a => a.training_id === trainingId));
    } catch (error) {}
  };

  const handleMarkAttendance = async (officerId: string) => {
    if (!selectedTrainingId) return;
    try {
      await api.recordAttendance({ officer_id: officerId, training_id: selectedTrainingId, recorded_by: 'system', method: 'manual', check_in_time: new Date().toISOString() });
      toast({ title: 'Checked In', description: 'Officer marked as attended' });
      handleViewEnrolled(selectedTrainingId);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to record attendance', variant: 'destructive' });
    }
  };

  const handleEnrollOfficer = async (officerId: string) => {
    if (!selectedTrainingId) return;
    try {
      await api.createTrainingRegistration({ training_id: selectedTrainingId, officer_id: officerId });
      toast({ title: 'Enrolled', description: 'Officer successfully registered' });
      handleViewEnrolled(selectedTrainingId);
      loadTrainings();
    } catch (error) {
      toast({ title: 'Registration Failed', description: 'Officer may already be enrolled', variant: 'destructive' });
    }
  };

  const availablePositions = Array.from(new Set(officers.map(o => o.position).filter(Boolean))) as string[];
  const currentT = trainings.find(t => t.id === selectedTrainingId);
  const targetPoss = currentT?.target_positions || [];
  const eligible = officers.filter(o => o.position && targetPoss.includes(o.position));
  const otherOffs = officers.filter(o => !o.position || !targetPoss.includes(o.position));

  const filteredListTrainings = useMemo(() => {
    return trainings.filter(t => {
      const s = listSearch.toLowerCase();
      return (t.title.toLowerCase().includes(s) || t.venue.toLowerCase().includes(s) || (t.speaker || '').toLowerCase().includes(s)) &&
             (listFilter === 'all' || t.status === listFilter);
    }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [trainings, listSearch, listFilter]);

  const isTrainingOnDay = (training: TrainingWithRegistrations, day: Date) => {
    try {
      const s = parseISO(training.start_date);
      return training.end_date ? isWithinInterval(day, { start: s, end: parseISO(training.end_date) }) : isSameDay(s, day);
    } catch { return false; }
  };

  return (
    <DashboardLayout title="Training Management" description="Manage schedules, events, and track multi-level officer compliance">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

        {/* --- STUNNING GLASSMORPHIC BANNER --- */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-card relative rounded-3xl overflow-hidden text-foreground shadow-lg p-6 lg:p-8 border border-white/10 dark:border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-3xl mix-blend-screen pointer-events-none -z-10" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-4 rounded-2xl backdrop-blur-md border border-primary/20 shadow-glow">
                <CalendarIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">Training Fleet</h2>
                <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> Naga City · Camarines Sur
                </p>
              </div>
            </div>
            <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }} size="lg" className="shadow-glow hover:scale-105 transition-transform font-bold rounded-xl bg-primary text-primary-foreground h-12 px-6">
              <Plus className="h-5 w-5 mr-2" /> Schedule Training
            </Button>
          </div>

          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Upcoming',  value: stats.upcoming,  icon: <CalendarDays className="h-5 w-5 text-amber-500" /> },
              { label: 'Ongoing',   value: stats.ongoing,   icon: <Clock className="h-5 w-5 text-blue-500" /> },
              { label: 'Completed', value: stats.completed, icon: <CheckCircle className="h-5 w-5 text-emerald-500" /> },
              { label: 'Total Enrolled',  value: stats.enrolled,  icon: <Users className="h-5 w-5 text-purple-500" /> },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex flex-col p-4 rounded-2xl bg-background/50 backdrop-blur-md border border-white/10 dark:border-white/5 shadow-soft hover:shadow-glow transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-muted/50">{s.icon}</div>
                  <span className="text-3xl font-black tabular-nums">{s.value}</span>
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <Tabs defaultValue="calendar" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-2 rounded-2xl border border-white/10">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="calendar" className="rounded-xl px-5 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">Training Calendar</TabsTrigger>
              <TabsTrigger value="compliance" className="rounded-xl px-5 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">Officer Compliance</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-1.5 p-1 bg-background/50 rounded-xl mr-2">
              <Button variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')} className="rounded-lg h-9">
                <LayoutGrid className="h-4 w-4 mr-2" /> Calendar
              </Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="rounded-lg h-9">
                <LayoutList className="h-4 w-4 mr-2" /> List
              </Button>
            </div>
          </div>

          <TabsContent value="calendar" className="mt-0 outline-none">
            {loading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <AnimatePresence mode="wait">
                {viewMode === 'calendar' ? (
                  <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                    <div className="flex items-center justify-between glass-card p-4 rounded-2xl">
                      <h2 className="text-2xl font-black tracking-tight">{format(currentDate, 'MMMM yyyy')}</h2>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" className="px-5 font-bold rounded-xl mx-2" onClick={() => setCurrentDate(new Date())}>Today</Button>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </div>

                    <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
                      <div className="grid grid-cols-7 border-b border-border/50 bg-muted/20">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                          <div key={d} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 auto-rows-fr gap-px bg-border/20">
                        {getDaysInMonth().map((day, idx) => {
                          const isCurrent = isSameMonth(day, currentDate);
                          const isTodayDate = isToday(day);
                          const dTrainings = trainings.filter(t => isTrainingOnDay(t, day));
                          return (
                            <div key={idx} onClick={() => { setFormData(p => ({ ...p, start_date: format(day, 'yyyy-MM-dd') })); setCreateDialogOpen(true); }}
                              className={`group min-h-[140px] p-2 flex flex-col gap-1.5 cursor-pointer transition-colors hover:bg-muted/50 bg-background ${!isCurrent ? 'bg-muted/20 text-muted-foreground' : ''} ${isTodayDate ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-bold h-7 w-7 flex flex-col items-center justify-center rounded-full ${isTodayDate ? 'bg-primary text-primary-foreground shadow-sm' : isCurrent ? 'text-foreground' : 'text-muted-foreground opacity-50'}`}>{format(day, 'd')}</span>
                                {dTrainings.length === 0 && isCurrent && <span className="opacity-0 group-hover:opacity-30 transition-opacity font-bold text-lg select-none">+</span>}
                              </div>
                              <div className="flex flex-col gap-1.5 px-0.5">
                                {dTrainings.map(t => {
                                  const tc = getTopicConfig(t.topic);
                                  const fill = t.capacity > 0 ? Math.min(100, Math.round((t.registered / t.capacity) * 100)) : 0;
                                  return (
                                    <div key={t.id} onClick={e => handleEdit(t, e)} className={`p-1.5 rounded-lg border backdrop-blur-md cursor-pointer transition-transform hover:scale-[1.03] shadow-sm ${STATUS_CHIP[t.status]} ${!isSameDay(parseISO(t.start_date), day) ? 'opacity-50' : ''}`}>
                                      <div className="flex items-center gap-1.5">
                                        <div className={`p-1 rounded-md bg-background/50 shadow-sm ${tc.color}`}>{tc.icon}</div>
                                        <span className="truncate font-bold text-xs flex-1 text-foreground leading-tight">{t.title}</span>
                                      </div>
                                      <div className="flex items-center justify-between mt-1.5 px-0.5">
                                        <span className="text-[10px] font-bold opacity-70 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{t.time?.slice(0,5)}</span>
                                        <span className="text-[10px] font-bold px-1.5 rounded-sm bg-background/50">{t.registered}/{t.capacity}</span>
                                      </div>
                                      <div className="mt-1.5 h-1 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${fill}%`, backgroundColor: fill >= 90 ? 'hsl(var(--destructive))' : fill >= 60 ? 'hsl(var(--warning, #eab308))' : 'hsl(var(--primary))' }} />
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
                  </motion.div>
                ) : (
                  <motion.div key="list" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="glass-card p-6 rounded-3xl border border-white/10">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="relative flex-1">
                        <Input className="pl-10 h-11 bg-background/50 rounded-xl" placeholder="Search trainings wildly..." value={listSearch} onChange={e => setListSearch(e.target.value)} />
                        <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
                      </div>
                      <Select value={listFilter} onValueChange={setListFilter}>
                        <SelectTrigger className="w-full sm:w-[200px] h-11 bg-background/50 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Modes</SelectItem>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="ongoing">Ongoing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {filteredListTrainings.map(t => {
                        const tc = getTopicConfig(t.topic);
                        const fill = t.capacity > 0 ? Math.min(100, Math.round((t.registered / t.capacity) * 100)) : 0;
                        return (
                          <motion.div variants={itemVariants} key={t.id}>
                            <Card className={`group relative overflow-hidden glass-card hover:-translate-y-1 hover:shadow-glow transition-all duration-300 border border-white/10 flex flex-col`}>
                              <div className={`absolute top-0 left-0 w-1.5 h-full ${STATUS_CHIP[t.status].split(' ')[0]} border-t border-b`} />
                              <CardContent className="p-5 pl-6 space-y-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start gap-2">
                                  <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${tc.color} ${tc.bg} ${tc.border}`}>
                                    {tc.icon} {t.topic}
                                  </div>
                                  <Badge variant="outline" className={`shadow-sm bg-background uppercase tracking-widest text-[10px] ${STATUS_CHIP[t.status]}`}>{t.status}</Badge>
                                </div>
                                
                                <h3 className="text-lg font-extrabold leading-tight">{t.title}</h3>
                                
                                <div className="grid grid-cols-2 gap-3 text-xs font-medium text-muted-foreground pt-1">
                                  <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg opacity-90"><CalendarDays className="h-4 w-4" />{format(parseISO(t.start_date), 'MMM d, yyyy')}</div>
                                  <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg opacity-90"><Clock className="h-4 w-4" />{t.time?.slice(0,5) || 'TBD'}</div>
                                  <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg opacity-90 col-span-2"><MapPin className="h-4 w-4 shrink-0" /><span className="truncate">{t.venue}</span></div>
                                </div>

                                <div className="mt-auto space-y-2 pt-4">
                                  <div className="flex justify-between text-xs font-bold opacity-80"><span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Seats</span><span>{t.registered} / {t.capacity}</span></div>
                                  <div className="h-2 rounded-full bg-muted/50 overflow-hidden"><div className={`h-full rounded-full`} style={{ width: `${fill}%`, backgroundColor: fill >= 90 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }} /></div>
                                </div>

                                <div className="flex gap-2 pt-4 mt-2 border-t border-border/50">
                                  <Button size="sm" variant="ghost" className="flex-1 rounded-xl bg-muted/30 hover:bg-muted" onClick={e => handleEdit(t, e)}>Edit</Button>
                                  <Button size="sm" variant="outline" className="flex-1 rounded-xl shadow-sm" onClick={() => { setSelectedTrainingId(t.id); setSelectedTrainingTitle(t.title); handleViewEnrolled(t.id); setViewEnrolledDialogOpen(true); }}>Attendees</Button>
                                  <Button size="sm" className="flex-1 rounded-xl shadow-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold" onClick={() => { setSelectedTrainingId(t.id); setEnrollmentDialogOpen(true); }}>Enroll <ArrowRight className="w-3.5 h-3.5 ml-1"/></Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </TabsContent>

          <TabsContent value="compliance"><OfficerCompliance /></TabsContent>
        </Tabs>

        {/* --- STUNNING DIALOGS --- */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card shadow-glow border-white/20 p-8 rounded-3xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-black">{editingTraining ? 'Revise Event' : 'Launch New Training'}</DialogTitle>
              <DialogDescription>Input the precise parameters for this academy module.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2 col-span-2"><Label className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Title</Label><Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="h-11 rounded-xl glass-input" required /></div>
                <div className="space-y-2"><Label className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Topic</Label><Select value={formData.topic} onValueChange={v => setFormData({ ...formData, topic: v })}><SelectTrigger className="h-11 rounded-xl glass-input"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Governance">Governance</SelectItem><SelectItem value="Compliance">Compliance</SelectItem><SelectItem value="Leadership">Leadership</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Status</Label><Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}><SelectTrigger className="h-11 rounded-xl glass-input"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="upcoming">Upcoming</SelectItem><SelectItem value="ongoing">Ongoing</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Date</Label><Input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="h-11 rounded-xl glass-input" required /></div>
                <div className="space-y-2"><Label className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Time</Label><Input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="h-11 rounded-xl glass-input" /></div>
                <div className="space-y-2"><Label className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Venue</Label><Input value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} className="h-11 rounded-xl glass-input" required /></div>
                <div className="space-y-2"><Label className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Capacity</Label><Input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} className="h-11 rounded-xl glass-input" /></div>
              </div>
              <div className="flex gap-3 pt-6 border-t border-border/50">
                {editingTraining && <Button type="button" variant="destructive" className="rounded-xl shadow-sm" onClick={() => handleDelete(editingTraining.id)}>Delete</Button>}
                <div className="flex gap-3 ml-auto">
                  <Button type="button" variant="ghost" onClick={() => setCreateDialogOpen(false)} className="rounded-xl">Cancel</Button>
                  <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground shadow-glow h-10 px-6">Commit Schedule</Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
          <DialogContent className="max-w-2xl glass-card rounded-3xl p-6 border-white/20">
            <DialogHeader className="mb-4"><DialogTitle className="text-2xl font-black">Officer Registry</DialogTitle></DialogHeader>
            <div className="overflow-y-auto h-[50vh] pr-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-2xl border border-primary/20"><h4 className="font-bold text-primary">Eligible Fleet</h4><Button size="sm" onClick={() => {}} disabled className="rounded-xl font-bold bg-primary/20 text-primary hover:bg-primary/30">Bulk Commit</Button></div>
                {eligible.concat(otherOffs).map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 rounded-2xl border glass-card hover:bg-muted/50 transition-colors">
                    <div><p className="font-bold">{o.full_name}</p><p className="text-xs text-muted-foreground opacity-80">{o.position || 'Standard'} • {o.cooperative}</p></div>
                    <Button size="sm" className="rounded-xl font-bold bg-primary shadow-sm hover:scale-105" onClick={() => handleEnrollOfficer(o.id)}>Enroll</Button>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={viewEnrolledDialogOpen} onOpenChange={setViewEnrolledDialogOpen}>
          <DialogContent className="max-w-2xl glass-card rounded-3xl p-6 border-white/20">
            <DialogHeader className="mb-4"><DialogTitle className="text-xl font-black">{selectedTrainingTitle}</DialogTitle><DialogDescription>Current flight manifest & attendance.</DialogDescription></DialogHeader>
            <div className="overflow-y-auto h-[50vh] pr-4">
              <div className="space-y-3">
                {selectedTrainingEnrollments.length === 0 ? <div className="py-12 text-center text-muted-foreground font-medium">Empty Manifest.</div> : selectedTrainingEnrollments.map(att => {
                  const attended = selectedTrainingAttendance.some(a => a.officer_id === att.officer_id);
                  return (
                    <div key={att.id} className="p-4 rounded-2xl border glass-card flex justify-between items-center shadow-sm">
                      <div><p className="font-bold">{att.officer_name || att.full_name}</p><p className="text-xs text-muted-foreground">{att.cooperative}</p></div>
                      {attended ? <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 px-3 py-1 font-bold">Present</Badge> : <Button size="sm" variant="outline" className="rounded-xl shadow-sm text-xs font-bold border-blue-500/30 text-blue-500 hover:bg-blue-500/10" onClick={() => handleMarkAttendance(att.officer_id)}>Verify Arrival</Button>}
                    </div>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default TrainingManagement;