import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft, QrCode, Users, Clock, CheckCircle, XCircle,
  Calendar, MapPin, UserCheck, Loader2, Search, Download,
  BarChart3, TrendingUp, AlertCircle, CheckSquare, Star,
  Shield, DollarSign, Mic,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Training {
  id: string;
  title: string;
  topic?: string;
  speaker?: string;
  date: string;
  time: string | null;
  venue: string;
  capacity: number;
  status: string;
  training_id: string;
}

// Same topic config as Training Management
const TOPIC_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  'Governance':          { icon: <Shield className="h-3.5 w-3.5" />,        color: 'text-indigo-700',  bg: 'bg-indigo-50',   border: 'border-indigo-200' },
  'Financial Management':{ icon: <DollarSign className="h-3.5 w-3.5" />,    color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  'Marketing':           { icon: <TrendingUp className="h-3.5 w-3.5" />,     color: 'text-orange-700',  bg: 'bg-orange-50',   border: 'border-orange-200' },
  'Leadership':          { icon: <Star className="h-3.5 w-3.5" />,           color: 'text-purple-700',  bg: 'bg-purple-50',   border: 'border-purple-200' },
  'Risk Management':     { icon: <AlertCircle className="h-3.5 w-3.5" />,    color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200' },
  'Compliance':          { icon: <CheckSquare className="h-3.5 w-3.5" />,    color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200' },
};
const getTopicConfig = (topic?: string) =>
  (topic && TOPIC_CONFIG[topic]) ?? { icon: <BarChart3 className="h-3.5 w-3.5" />, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' };

interface EnrolledOfficer {
  id: string;
  officer_id: string;
  training_id: string;
  registered_at: string;
  profiles: {
    id: string;
    full_name: string;
    cooperative: string | null;
    position: string | null;
    username: string;
  };
  attendance?: {
    id: string;
    recorded_at: string;
    method: string;
    check_in_time: string | null;
  };
}

// Helper: initials from full name
const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();

// Helper: format time
const fmtTime = (t: string | null) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

const Attendance = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [attendanceMethod, setAttendanceMethod] = useState<'qr' | 'manual'>('manual');
  const [loading, setLoading] = useState(true);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [officerFilter, setOfficerFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [confirmMarkAll, setConfirmMarkAll] = useState(false);

  const [activeEvents, setActiveEvents] = useState<Training[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Training[]>([]);
  const [enrolledOfficers, setEnrolledOfficers] = useState<EnrolledOfficer[]>([]);

  // enriched per-event stats for event cards
  const [eventStats, setEventStats] = useState<Record<string, { present: number; total: number }>>({});

  useEffect(() => { loadTrainings(); }, []);

  useEffect(() => {
    if (selectedEvent) {
      setSearchTerm('');
      setOfficerFilter('all');
      loadEnrolledOfficers(selectedEvent);
    }
  }, [selectedEvent]);

  const loadTrainings = async () => {
    try {
      const { data: trainings, error } = await api.getTrainings();
      if (error) throw error;

      const active   = trainings?.filter(t => t.status === 'ongoing').map(t => ({ ...t, time: t.time || null })) || [];
      const upcoming = trainings?.filter(t => t.status === 'upcoming').map(t => ({ ...t, time: t.time || null })) || [];

      setActiveEvents(active);
      setUpcomingEvents(upcoming);

      // Load per-event stats for cards (best effort)
      const allVisible = [...active, ...upcoming];
      const statsMap: Record<string, { present: number; total: number }> = {};
      await Promise.all(allVisible.map(async ev => {
        try {
          const { data: regs } = await api.getTrainingRegistrationsByTraining(ev.id);
          const { data: att } = await api.getAttendance();
          const evAtt = (att || []).filter((a: any) => a.training_id === ev.id);
          statsMap[ev.id] = { present: evAtt.length, total: (regs || []).length };
        } catch { statsMap[ev.id] = { present: 0, total: 0 }; }
      }));
      setEventStats(statsMap);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load training events', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadEnrolledOfficers = async (trainingId: string) => {
    try {
      setLoading(true);
      const { data: registrations, error: regError } = await api.getTrainingRegistrationsByTraining(trainingId);
      if (regError || !registrations) { setEnrolledOfficers([]); return; }

      const { data: profiles } = await api.getProfiles();
      const { data: attendanceRecords } = await api.getAttendance();
      const trainingAttendance = attendanceRecords?.filter((att: any) => att.training_id === trainingId) || [];

      const enriched = registrations.map((reg: any) => {
        const profile = profiles?.find((p: any) => p.id === reg.officer_id);
        const attendance = trainingAttendance.find((att: any) => att.officer_id === reg.officer_id);
        return {
          id: reg.id,
          officer_id: reg.officer_id,
          training_id: reg.training_id,
          registered_at: reg.registered_at,
          profiles: profile || { id: reg.officer_id, full_name: 'Unknown Officer', cooperative: null, position: null, username: 'unknown' },
          attendance: attendance ? {
            id: attendance.id,
            recorded_at: attendance.recorded_at,
            method: attendance.method || 'manual',
            check_in_time: attendance.recorded_at ? new Date(attendance.recorded_at).toTimeString().split(' ')[0] : null
          } : undefined,
        };
      });
      setEnrolledOfficers(enriched);
    } catch {
      toast({ title: 'Error', description: 'Failed to load enrolled officers', variant: 'destructive' });
      setEnrolledOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (officerId: string) => {
    if (!selectedEvent) return;
    try {
      setMarkingAttendance(true);
      const currentUserId = localStorage.getItem('userId') || '11111111-1111-1111-1111-111111111111';
      const { error } = await api.recordAttendance({
        officer_id: officerId,
        training_id: selectedEvent,
        recorded_by: currentUserId,
        method: attendanceMethod,
        check_in_time: new Date().toISOString(),
      });
      if (error) throw error;
      toast({ title: 'Checked In', description: 'Attendance recorded successfully.' });
      setTimeout(() => loadEnrolledOfficers(selectedEvent), 300);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to record attendance', variant: 'destructive' });
    } finally {
      setMarkingAttendance(false);
    }
  };

  const markAllPresent = async () => {
    if (!selectedEvent) return;
    setConfirmMarkAll(false);
    const absentOfficers = enrolledOfficers.filter(o => !o.attendance);
    if (absentOfficers.length === 0) { toast({ title: 'All Present', description: 'Everyone is already checked in.' }); return; }
    try {
      setMarkingAttendance(true);
      const currentUserId = localStorage.getItem('userId') || '11111111-1111-1111-1111-111111111111';
      await Promise.all(absentOfficers.map(o =>
        api.recordAttendance({
          officer_id: o.officer_id,
          training_id: selectedEvent,
          recorded_by: currentUserId,
          method: attendanceMethod,
          check_in_time: new Date().toISOString(),
        })
      ));
      toast({ title: 'All Checked In', description: `${absentOfficers.length} officer(s) marked present.` });
      loadEnrolledOfficers(selectedEvent);
    } catch {
      toast({ title: 'Error', description: 'Some check-ins may have failed.', variant: 'destructive' });
      loadEnrolledOfficers(selectedEvent);
    } finally {
      setMarkingAttendance(false);
    }
  };

  const exportToCSV = () => {
    if (!selectedEventData || enrolledOfficers.length === 0) {
      toast({ title: 'No Data', description: 'No enrolled officers to export.', variant: 'destructive' });
      return;
    }
    const headers = ['Officer ID', 'Full Name', 'Cooperative', 'Position', 'Username', 'Enrollment Date', 'Status', 'Check-in Time', 'Method'];
    const rows = enrolledOfficers.map(o => [
      o.officer_id, o.profiles.full_name, o.profiles.cooperative || 'N/A',
      o.profiles.position || 'N/A', o.profiles.username,
      new Date(o.registered_at).toLocaleDateString(),
      o.attendance ? 'Present' : 'Absent',
      o.attendance?.check_in_time || 'N/A',
      o.attendance?.method || 'N/A',
    ]);
    const csv = [headers, ...rows].map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${selectedEventData.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exported', description: 'Attendance CSV downloaded.' });
  };

  // --- DERIVED ---
  const selectedEventData = selectedEvent ? [...activeEvents, ...upcomingEvents].find(e => e.id === selectedEvent) : null;
  const presentCount = enrolledOfficers.filter(o => o.attendance).length;
  const absentCount = enrolledOfficers.length - presentCount;
  const totalCount  = enrolledOfficers.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const filteredOfficers = useMemo(() =>
    enrolledOfficers.filter(o => {
      const matchSearch =
        o.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.profiles.cooperative || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter =
        officerFilter === 'all'     ? true :
        officerFilter === 'present' ? !!o.attendance :
        !o.attendance;
      return matchSearch && matchFilter;
    }),
    [enrolledOfficers, searchTerm, officerFilter]
  );

  // Global stats across all loaded events
  const globalPresent = Object.values(eventStats).reduce((s, e) => s + e.present, 0);
  const globalTotal   = Object.values(eventStats).reduce((s, e) => s + e.total, 0);
  const globalRate    = globalTotal > 0 ? Math.round((globalPresent / globalTotal) * 100) : 0;

  // Event card helper — matches Training Management list card style
  const EventCard = ({ event, isActive }: { event: Training; isActive: boolean }) => {
    const es = eventStats[event.id] ?? { present: 0, total: 0 };
    const rate = es.total > 0 ? Math.round((es.present / es.total) * 100) : 0;
    const tc = getTopicConfig(event.topic);
    const borderAccent = isActive ? 'border-l-emerald-500' : 'border-l-blue-400';
    return (
      <Card
        className={`bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-gray-200 border-l-4 ${borderAccent} group cursor-pointer`}
        onClick={() => setSelectedEvent(event.id)}
      >
        <CardContent className="p-4 space-y-3">
          {/* Topic + status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${tc.color} ${tc.bg} ${tc.border}`}>
              {tc.icon} {event.topic || 'General'}
            </span>
            <Badge className={isActive
              ? 'text-[11px] bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'text-[11px] bg-blue-50 text-blue-800 border-blue-200'
            }>
              {isActive ? <><Clock className="h-3 w-3 mr-1" />Active</> : 'Upcoming'}
            </Badge>
            <span className="ml-auto text-[10px] text-gray-400 font-mono">{event.training_id}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-[15px] leading-snug group-hover:text-blue-700 transition-colors">
            {event.title}
          </h3>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              {new Date(event.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {event.time && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                {fmtTime(event.time)}
              </div>
            )}
            <div className="flex items-center gap-1.5 col-span-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              {event.venue}
            </div>
            {event.speaker && (
              <div className="flex items-center gap-1.5 col-span-2">
                <Mic className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                {event.speaker}
              </div>
            )}
          </div>

          {/* Attendance rate bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-gray-500">
              <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Attendance</span>
              <span className={`${rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                {es.present}/{es.total} · {rate}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>

          {/* Action */}
          <div className="pt-1 border-t border-gray-100">
            <Button size="sm" className={`w-full h-8 text-xs font-semibold ${isActive ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`} variant={isActive ? 'default' : 'outline'}>
              {isActive ? 'Take Attendance' : 'Prepare Attendance'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout title="Attendance Management" description="Track and manage training attendance">
      <div className="p-6 space-y-6">

        {/* ── STATS BANNER ── */}
        {!selectedEvent && (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#13233e] via-[#1c3760] to-[#0f4c8a] text-white shadow-lg p-6">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 40%, white 0%, transparent 60%)' }} />
            <div className="relative z-10 flex items-center gap-4 mb-5">
              <div className="bg-white/10 p-3 rounded-xl border border-white/20">
                <UserCheck className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Attendance Management</h2>
                <p className="text-blue-200/80 text-sm font-medium mt-0.5">Naga City · Camarines Sur · Region V</p>
              </div>
            </div>
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Active Events',     value: activeEvents.length,   icon: <Clock className="h-4 w-4 text-white/70" />,     num: 'text-white' },
                { label: 'Upcoming Events',   value: upcomingEvents.length, icon: <Calendar className="h-4 w-4 text-white/70" />,  num: 'text-white' },
                { label: 'Officers Enrolled', value: globalTotal,           icon: <Users className="h-4 w-4 text-white/70" />,     num: 'text-white' },
                { label: 'Avg. Attendance',   value: `${globalRate}%`,      icon: <BarChart3 className="h-4 w-4 text-white/70" />, num: globalRate >= 80 ? 'text-emerald-300' : globalRate >= 50 ? 'text-amber-300' : 'text-red-300' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl bg-white/10 border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    {s.icon}
                    <span className={`text-2xl font-extrabold ${s.num}`}>{s.value}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && !selectedEvent ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-600" />
            <span className="text-gray-500 font-medium">Loading events...</span>
          </div>
        ) : !selectedEvent ? (

          /* ── EVENT SELECTION ── */
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active Events ({activeEvents.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Events ({upcomingEvents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              {activeEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeEvents.map(ev => <EventCard key={ev.id} event={ev} isActive={true} />)}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400 border rounded-xl bg-white">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <h3 className="font-semibold text-gray-600">No Active Events</h3>
                  <p className="text-sm mt-1 mb-4">No currently ongoing training sessions.</p>
                  <Button onClick={() => navigate('/training-management')}>Create Training Event</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-4">
              {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents.map(ev => <EventCard key={ev.id} event={ev} isActive={false} />)}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400 border rounded-xl bg-white">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <h3 className="font-semibold text-gray-600">No Upcoming Events</h3>
                  <p className="text-sm mt-1 mb-4">No upcoming training events scheduled.</p>
                  <Button onClick={() => navigate('/training-management')}>Create Training Event</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

        ) : (

          /* ── ATTENDANCE SESSION VIEW ── */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)} className="mb-2 -ml-2 gap-1.5 text-gray-600">
                  <ArrowLeft className="h-4 w-4" /> Back to Events
                </Button>
                <h2 className="text-xl font-bold text-gray-900">{selectedEventData?.title}</h2>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {selectedEventData && new Date(selectedEventData.date).toLocaleDateString('en-PH', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                  {selectedEventData?.time && <> · <Clock className="h-3.5 w-3.5" />{fmtTime(selectedEventData.time)}</>}
                  {selectedEventData?.venue && <> · <MapPin className="h-3.5 w-3.5" />{selectedEventData.venue}</>}
                </p>
              </div>

              {/* Rate ring */}
              <div className="flex items-center gap-3 bg-white border border-gray-100 shadow-sm rounded-xl px-5 py-3 shrink-0">
                <div className="relative h-14 w-14">
                  <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                    <circle
                      cx="28" cy="28" r="22" fill="none" strokeWidth="5"
                      stroke={attendanceRate >= 80 ? '#10b981' : attendanceRate >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeDasharray={`${(attendanceRate / 100) * 138.2} 138.2`}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-gray-800">{attendanceRate}%</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{presentCount}/{totalCount}</p>
                  <p className="text-xs text-gray-500 font-medium">Officers Present</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ── SIDEBAR ── */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Attendance Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select value={attendanceMethod} onValueChange={(v: any) => setAttendanceMethod(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">✋ Manual Check-in</SelectItem>
                        <SelectItem value="qr">📷 QR Code Scan</SelectItem>
                      </SelectContent>
                    </Select>

                    {attendanceMethod === 'qr' && (
                      <div className="p-4 border rounded-lg text-center bg-gray-50">
                        <div className="w-28 h-28 bg-white border-2 border-dashed border-gray-300 mx-auto mb-3 rounded-lg flex items-center justify-center">
                          <QrCode className="h-14 w-14 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500">QR Code scanning requires hardware integration. Use Manual mode for now.</p>
                      </div>
                    )}

                    {/* Quick stats */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                      <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-3">Session Stats</h4>
                      {[
                        { label: 'Enrolled',        val: totalCount,        cls: 'text-gray-700' },
                        { label: 'Present',         val: presentCount,      cls: 'text-emerald-700 font-bold' },
                        { label: 'Absent',          val: absentCount,       cls: 'text-red-600 font-bold' },
                        { label: 'Attendance Rate', val: `${attendanceRate}%`, cls: attendanceRate >= 80 ? 'text-emerald-700 font-bold' : attendanceRate >= 50 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold' },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between text-sm">
                          <span className="text-gray-500">{row.label}</span>
                          <span className={row.cls}>{row.val}</span>
                        </div>
                      ))}
                      {totalCount > 0 && (
                        <div className="pt-2">
                          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${attendanceRate >= 80 ? 'bg-emerald-500' : attendanceRate >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mark All */}
                    {attendanceMethod === 'manual' && absentCount > 0 && (
                      <Button
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => setConfirmMarkAll(true)}
                        disabled={markingAttendance}
                      >
                        <CheckSquare className="h-4 w-4" />
                        Mark All Present ({absentCount})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── OFFICER LIST ── */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3 border-b border-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">Enrolled Officers ({totalCount})</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {attendanceMethod === 'manual' ? 'Click "Check In" to mark attendance' : 'Real-time attendance tracking'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={exportToCSV} disabled={enrolledOfficers.length === 0} className="gap-1.5">
                        <Download className="h-4 w-4" /> Export
                      </Button>
                    </div>
                  </div>

                  {/* Search + filter */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input placeholder="Search by name or cooperative..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                      {(['all', 'present', 'absent'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setOfficerFilter(f)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                            officerFilter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {f === 'all' ? `All (${totalCount})` : f === 'present' ? `Present (${presentCount})` : `Absent (${absentCount})`}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-600" />
                      <span className="text-sm text-gray-500">Loading officers...</span>
                    </div>
                  ) : filteredOfficers.length > 0 ? (
                    <div className="space-y-2">
                      {filteredOfficers.map((officer) => {
                        const isPresent = !!officer.attendance;
                        const initStr = initials(officer.profiles.full_name);
                        return (
                          <div
                            key={officer.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                              isPresent
                                ? 'border-emerald-100 bg-emerald-50/40 border-l-4 border-l-emerald-400'
                                : 'border-gray-100 bg-white border-l-4 border-l-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                                isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {initStr}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-gray-900">{officer.profiles.full_name}</p>
                                <p className="text-xs text-gray-400">
                                  {officer.profiles.cooperative || 'No Cooperative'} · {officer.profiles.position || 'No Position'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isPresent ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  {officer.attendance?.check_in_time?.slice(0, 5) || 'In'}
                                </Badge>
                              ) : (
                                <>
                                  <Badge className="bg-gray-100 text-gray-500 border-gray-200 gap-1">
                                    <XCircle className="h-3 w-3" /> Absent
                                  </Badge>
                                  {attendanceMethod === 'manual' && (
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                                      onClick={() => markAttendance(officer.officer_id)}
                                      disabled={markingAttendance}
                                    >
                                      {markingAttendance ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Check In'}
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="font-medium text-gray-500">
                        {searchTerm || officerFilter !== 'all' ? 'No officers match your filter' : 'No officers enrolled'}
                      </p>
                      {!searchTerm && officerFilter !== 'all' && (
                        <Button variant="link" size="sm" onClick={() => setOfficerFilter('all')} className="mt-1">
                          Clear filter
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── MARK ALL CONFIRMATION DIALOG ── */}
        <Dialog open={confirmMarkAll} onOpenChange={setConfirmMarkAll}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" /> Mark All Present?
              </DialogTitle>
              <DialogDescription>
                This will check in all <strong>{absentCount}</strong> absent officer{absentCount !== 1 ? 's' : ''} for this training session. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmMarkAll(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={markAllPresent}>
                <CheckCircle className="h-4 w-4 mr-1.5" /> Confirm — Mark All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default Attendance;
