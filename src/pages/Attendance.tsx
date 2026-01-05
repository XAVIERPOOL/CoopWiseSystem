import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  QrCode, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  UserCheck,
  Loader2,
  Search,
  Download
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Training {
  id: string;
  title: string;
  date: string;
  time: string | null;
  venue: string;
  capacity: number;
  status: string;
  training_id: string;
}

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

const Attendance = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [attendanceMethod, setAttendanceMethod] = useState<'qr' | 'manual' | 'nfc' | 'biometric'>('manual');
  const [loading, setLoading] = useState(true);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [activeEvents, setActiveEvents] = useState<Training[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Training[]>([]);
  const [enrolledOfficers, setEnrolledOfficers] = useState<EnrolledOfficer[]>([]);

  useEffect(() => {
    loadTrainings();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadEnrolledOfficers(selectedEvent);
    }
  }, [selectedEvent]);

  const loadTrainings = async () => {
    try {
      const { data: trainings, error } = await api.getTrainings();

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      
      const active = trainings?.filter(t => t.status === 'ongoing').map(t => ({
        ...t,
        time: t.time || null
      })) || [];
      const upcoming = trainings?.filter(t => t.status === 'upcoming' && t.date >= today).map(t => ({
        ...t,
        time: t.time || null
      })) || [];
      
      setActiveEvents(active);
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('Error loading trainings:', error);
      toast({
        title: "Error",
        description: "Failed to load training events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEnrolledOfficers = async (trainingId: string) => {
    try {
      setLoading(true);
      
      const { data: registrations, error: regError } = await api.getTrainingRegistrationsByTraining(trainingId);

      if (regError || !registrations) {
        setEnrolledOfficers([]);
        return;
      }

      const { data: profiles } = await api.getProfiles();

      const { data: attendanceRecords } = await api.getAttendance();
      const trainingAttendance = attendanceRecords?.filter(att => att.training_id === trainingId) || [];

      const enrichedOfficers = registrations.map((reg: any) => {
        const profile = profiles?.find(p => p.id === reg.officer_id);
        const attendance = trainingAttendance.find(att => att.officer_id === reg.officer_id);
        
        return {
          id: reg.id,
          officer_id: reg.officer_id,
          training_id: reg.training_id,
          registered_at: reg.registered_at,
          profiles: profile || {
            id: reg.officer_id,
            full_name: 'Unknown Officer',
            cooperative: null,
            position: null,
            username: 'unknown'
          },
          attendance: attendance ? {
            id: attendance.id,
            recorded_at: attendance.recorded_at,
            method: attendance.method || 'manual',
            check_in_time: attendance.recorded_at ? new Date(attendance.recorded_at).toTimeString().split(' ')[0] : null
          } : null
        };
      });

      setEnrolledOfficers(enrichedOfficers);
    } catch (error) {
      console.error('Error loading enrolled officers:', error);
      toast({
        title: "Error",
        description: "Failed to load enrolled officers",
        variant: "destructive",
      });
      setEnrolledOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (officerId: string, present: boolean) => {
    if (!selectedEvent) return;

    try {
      setMarkingAttendance(true);

      const currentUserId = localStorage.getItem('userId') || '11111111-1111-1111-1111-111111111111';

      if (present) {
        const { data, error } = await api.recordAttendance({
          officer_id: officerId,
          training_id: selectedEvent,
          recorded_by: currentUserId,
          method: attendanceMethod,
          check_in_time: new Date().toISOString()
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: `Officer attendance recorded successfully via ${attendanceMethod}.`,
        });
      } else {
        toast({
          title: "Info",
          description: "Officer marked as absent.",
        });
      }

      setTimeout(() => {
        loadEnrolledOfficers(selectedEvent);
      }, 300);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMarkingAttendance(false);
    }
  };

  const generateQRCode = () => {
    if (!selectedEvent) return;
    
    const qrData = {
      type: 'training_attendance',
      training_id: selectedEvent,
      timestamp: Date.now()
    };
    
    toast({
      title: "QR Code Generated",
      description: "Officers can scan this QR code to mark their attendance.",
    });
    
    console.log('QR Code Data:', JSON.stringify(qrData));
  };

  const exportToCSV = () => {
    if (!selectedEventData || enrolledOfficers.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please ensure there are enrolled officers to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Officer ID',
      'Full Name', 
      'Cooperative',
      'Position',
      'Username',
      'Enrollment Date',
      'Attendance Status',
      'Check-in Time',
      'Attendance Method'
    ];

    const csvData = enrolledOfficers.map(officer => [
      officer.officer_id,
      officer.profiles.full_name,
      officer.profiles.cooperative || 'N/A',
      officer.profiles.position || 'N/A',
      officer.profiles.username,
      new Date(officer.registered_at).toLocaleDateString(),
      officer.attendance ? 'Present' : 'Absent',
      officer.attendance?.check_in_time || 'N/A',
      officer.attendance?.method || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_${selectedEventData.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Attendance list has been downloaded as CSV file.",
      });
    }
  };

  const selectedEventData = selectedEvent ? 
    [...activeEvents, ...upcomingEvents].find(e => e.id === selectedEvent) : null;

  const filteredOfficers = enrolledOfficers.filter(officer =>
    officer.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.profiles.cooperative?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = enrolledOfficers.filter(o => o.attendance).length;
  const totalCount = enrolledOfficers.length;

  return (
    <DashboardLayout title="Attendance Management" description="Track and manage training attendance">
      <div className="p-6">
        {loading && !selectedEvent ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading training events...</span>
          </div>
        ) : !selectedEvent ? (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Training Event</h2>
              
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active">Active Events ({activeEvents.length})</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming Events ({upcomingEvents.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="space-y-4">
                  {activeEvents.length > 0 ? (
                    activeEvents.map((event) => (
                      <Card key={event.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedEvent(event.id)}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                              <p className="text-sm text-gray-600 mb-2">ID: {event.training_id}</p>
                              <Badge className="bg-green-100 text-green-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Currently Active
                              </Badge>
                            </div>
                            <Button>Take Attendance</Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(event.date).toLocaleDateString()} 
                              {event.time && ` at ${event.time}`}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {event.venue}
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Capacity: {event.capacity}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Events</h3>
                        <p className="text-gray-600">There are no currently active training events.</p>
                        <Button 
                          onClick={() => navigate('/training-management')} 
                          className="mt-4"
                        >
                          Create Training Event
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="upcoming" className="space-y-4">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <Card key={event.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedEvent(event.id)}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                              <p className="text-sm text-gray-600 mb-2">ID: {event.training_id}</p>
                              <Badge className="bg-blue-100 text-blue-800">
                                Upcoming
                              </Badge>
                            </div>
                            <Button variant="outline">Prepare Attendance</Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(event.date).toLocaleDateString()}
                              {event.time && ` at ${event.time}`}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {event.venue}
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Capacity: {event.capacity}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Events</h3>
                        <p className="text-gray-600">There are no upcoming training events scheduled.</p>
                        <Button 
                          onClick={() => navigate('/training-management')} 
                          className="mt-4"
                        >
                          Create Training Event
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedEvent(null)}
                  className="mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Events
                </Button>
                <h2 className="text-2xl font-bold text-gray-900">{selectedEventData?.title}</h2>
                <p className="text-gray-600">
                  {selectedEventData && new Date(selectedEventData.date).toLocaleDateString()} • {selectedEventData?.venue}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {presentCount}/{totalCount}
                </div>
                <p className="text-sm text-gray-600">Attendees Present</p>
                {totalCount > 0 && (
                  <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                    <div
                      className="h-2 bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${(presentCount / totalCount) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Attendance Method</CardTitle>
                  <CardDescription>Choose how to track attendance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Select value={attendanceMethod} onValueChange={(value: any) => setAttendanceMethod(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Check-in</SelectItem>
                        <SelectItem value="qr">QR Code Scan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {attendanceMethod === 'qr' && (
                    <div className="mt-6 p-4 border rounded-lg text-center">
                      <div className="w-32 h-32 bg-gray-200 mx-auto mb-4 rounded-lg flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-gray-400" />
                      </div>
                      <Button onClick={generateQRCode} className="w-full mb-2">
                        Generate QR Code
                      </Button>
                      <p className="text-xs text-gray-600">
                        Officers can scan this code to mark attendance
                      </p>
                    </div>
                  )}

                  {(attendanceMethod === 'nfc' || attendanceMethod === 'biometric') && (
                    <div className="mt-6 p-4 border rounded-lg text-center">
                      <div className="w-32 h-32 bg-gray-200 mx-auto mb-4 rounded-lg flex items-center justify-center">
                        <UserCheck className="h-16 w-16 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600">
                        {attendanceMethod === 'nfc' 
                          ? 'Ready for NFC device scanning'
                          : 'Ready for biometric verification'
                        }
                      </p>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Quick Stats</h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      <div className="flex justify-between">
                        <span>Total Enrolled:</span>
                        <span>{totalCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Present:</span>
                        <span>{presentCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Absent:</span>
                        <span>{totalCount - presentCount}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Attendance Rate:</span>
                        <span>{totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Enrolled Officers ({totalCount})</CardTitle>
                      <CardDescription>
                        {attendanceMethod === 'manual' ? 'Click to mark attendance manually' : 'Real-time attendance tracking'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        disabled={enrolledOfficers.length === 0}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                      <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search officers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading enrolled officers...
                    </div>
                  ) : filteredOfficers.length > 0 ? (
                    <div className="space-y-3">
                      {filteredOfficers.map((officer) => (
                        <div 
                          key={officer.id} 
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{officer.profiles.full_name}</p>
                              <p className="text-sm text-gray-600">
                                {officer.profiles.cooperative || 'No Cooperative'} • {officer.profiles.position || 'No Position'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {officer.attendance ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Present ({officer.attendance.check_in_time?.slice(0, 5) || 'N/A'})
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Absent
                              </Badge>
                            )}
                            {attendanceMethod === 'manual' && !officer.attendance && (
                              <Button
                                size="sm"
                                onClick={() => markAttendance(officer.officer_id, true)}
                                disabled={markingAttendance}
                              >
                                {markingAttendance ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Mark Present'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Officers Enrolled</h3>
                      <p className="text-gray-600">
                        {searchTerm ? 'No officers match your search.' : 'No officers have enrolled for this training yet.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
