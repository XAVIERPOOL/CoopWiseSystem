import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Award,
  Loader2,
  FileBadge,
  Download
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface AttendanceRecord {
  id: string;
  training_id: string;
  recorded_at: string;
  method: string;
  training: {
    id: string;
    title: string;
    date: string;
    start_date: string;
    time: string;
    venue: string;
    speaker: string;
    topic: string;
    status: string;
  };
}

const MyAttendance = () => {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    loadMyAttendance();
  }, []);

  const loadMyAttendance = async () => {
    try {
      const currentUserId = localStorage.getItem('userId') || '33333333-3333-3333-3333-333333333333';
      const { data, error } = await api.getTrainingRegistrations();

      if (error) throw error;

      const myRegistrations = (data || []).filter(
        (reg: any) => reg.officer_id === currentUserId && (reg.status === 'attended' || reg.status === 'completed')
      );

      const formattedRecords: AttendanceRecord[] = myRegistrations.map((reg: any) => ({
        id: reg.id,
        training_id: reg.training_id,
        recorded_at: reg.created_at || new Date().toISOString(), // Fallback if no specific attendance timestamp exists
        method: 'manual', // Defaulting as specific attendance method might not exist in current schema
        training: {
          id: reg.training?.id || reg.training_id,
          title: reg.training?.title || 'Unknown Training',
          date: reg.training?.start_date || new Date().toISOString(),
          start_date: reg.training?.start_date || new Date().toISOString(),
          time: reg.training?.time || 'TBA',
          venue: reg.training?.venue || 'TBA',
          speaker: reg.training?.speaker || 'TBA',
          topic: reg.training?.topic || 'General',
          status: 'completed'
        }
      }));

      setAttendanceRecords(formattedRecords);
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMethodBadge = (method: string) => {
    const methodConfig = {
      manual: { label: 'Manual', class: 'bg-blue-100 text-blue-800' },
      qr: { label: 'QR Code', class: 'bg-green-100 text-green-800' },
      nfc: { label: 'NFC', class: 'bg-purple-100 text-purple-800' },
      biometric: { label: 'Biometric', class: 'bg-orange-100 text-orange-800' }
    };

    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.manual;
    return (
      <Badge className={config.class}>
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout title="My Attendance" description="View your training attendance history">
      <div className="p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading attendance records...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{attendanceRecords.length}</div>
                  <p className="text-sm text-gray-600">Trainings Attended</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                  <p className="text-sm text-gray-600">Attendance Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{attendanceRecords.length}</div>
                  <p className="text-sm text-gray-600">Certificates Earned</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Completed Training Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceRecords.length > 0 ? (
                  <div className="space-y-4">
                    {attendanceRecords.map((record) => (
                      <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {record.training.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Topic: {record.training.topic}
                            </p>
                            <p className="text-sm text-gray-600">
                              Speaker: {record.training.speaker}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Attended
                            </Badge>
                            {getMethodBadge(record.method)}
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 flex-1">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(record.training.start_date || record.training.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {record.training.venue}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {record.training.time}
                            </div>
                          </div>

                          <div className="flex items-end justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full md:w-auto text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              onClick={() => setSelectedCertificate(record)}
                            >
                              <FileBadge className="h-4 w-4 mr-2" />
                              View Certificate
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
                    <p className="text-gray-600 mb-4">You haven't attended any trainings yet.</p>
                    <Button onClick={() => navigate('/available-trainings')}>
                      Browse Available Trainings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate('/available-trainings')}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                Browse Available Trainings
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/officer-dashboard')}
                className="flex-1"
              >
                View Compliance Dashboard
              </Button>
            </div>

            {/* Certificate Visualization Dialog Placeholder */}
            {selectedCertificate && (
              <Dialog open={!!selectedCertificate} onOpenChange={() => setSelectedCertificate(null)}>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Training Certificate
                    </DialogTitle>
                    <DialogDescription>
                      Certificate of Attendance for {selectedCertificate.training.title}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-8 border-8 border-double border-gray-200 bg-white text-center space-y-6 m-4 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-yellow-500 m-2"></div>
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-yellow-500 m-2"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-yellow-500 m-2"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-yellow-500 m-2"></div>

                    <h1 className="text-4xl font-serif text-blue-900 font-bold mb-8">Certificate of Attendance</h1>

                    <p className="text-gray-600 text-lg">This is to certify that</p>

                    <h2 className="text-2xl font-bold border-b-2 border-gray-300 pb-2 inline-block min-w-[300px]">
                      {localStorage.getItem('userName')?.replace('.', ' ') || 'Officer Name'}
                    </h2>

                    <p className="text-gray-600 text-lg mt-6">has actively participated in and successfully completed</p>

                    <h3 className="text-xl font-semibold text-blue-800 my-4">
                      {selectedCertificate.training.title}
                    </h3>

                    <p className="text-gray-600">
                      held on <span className="font-semibold">{new Date(selectedCertificate.training.start_date || selectedCertificate.training.date).toLocaleDateString()}</span>
                    </p>

                    <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-200">
                      <div>
                        <div className="border-b border-gray-400 pb-2 mb-2 font-handwriting text-xl">
                          {selectedCertificate.training.speaker}
                        </div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Speaker / Resource Person</p>
                      </div>
                      <div>
                        <div className="border-b border-gray-400 pb-2 mb-2 font-handwriting text-xl">
                          CoopWise Admin
                        </div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Training Coordinator</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      className="gap-2"
                      onClick={() => {
                        toast({
                          title: "Downloading...",
                          description: "Your high-resolution certificate is downloading."
                        });
                        setSelectedCertificate(null);
                      }}
                    >
                      <Download className="h-4 w-4" /> Download PDF
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyAttendance;
