import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Users, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Training {
  id: string;
  title: string;
  start_date: string;
  venue: string;
  capacity: number;
}

interface EnrollmentWithCompanionDialogProps {
  training: Training;
  children: React.ReactNode;
  onEnrollmentSuccess?: () => void;
}

export const EnrollmentWithCompanionDialog: React.FC<EnrollmentWithCompanionDialogProps> = ({ 
  training, 
  children,
  onEnrollmentSuccess 
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companions, setCompanions] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    position: string;
  }>>([]);
  
  const { toast } = useToast();

  // Get current user ID using the same logic as AvailableTrainings
  const getCurrentUserId = () => {
    const userName = localStorage.getItem('userName') || 'officer.two';
    const userIdMap: { [key: string]: string } = {
      'officer.one': '22222222-2222-2222-2222-222222222222',
      'officer.two': '33333333-3333-3333-3333-333333333333',
      'officer.three': '44444444-4444-4444-4444-444444444444',
      'officer.four': '55555555-5555-5555-5555-555555555555'
    };
    return userIdMap[userName] || '33333333-3333-3333-3333-333333333333';
  };

  const addCompanion = () => {
    if (companions.length < 3) {
      setCompanions([...companions, {
        id: `companion-${Date.now()}`,
        name: '',
        email: '',
        phone: '',
        position: ''
      }]);
    }
  };

  const removeCompanion = (companionId: string) => {
    setCompanions(companions.filter(c => c.id !== companionId));
  };

  const updateCompanion = (companionId: string, field: string, value: string) => {
    setCompanions(companions.map(c => 
      c.id === companionId ? { ...c, [field]: value } : c
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate companions if any exist
    const invalidCompanions = companions.filter(c => !c.name || !c.email);
    if (invalidCompanions.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in name and email for all companions.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const currentUserId = getCurrentUserId();
      console.log('Enrolling user:', currentUserId, 'in training:', training.id);
      console.log('Companions:', companions);

      // Enroll officer and companions in one API call
      const companionsData = companions.length > 0 ? companions.map(companion => ({
        name: companion.name,
        email: companion.email,
        phone: companion.phone || undefined,
        position: companion.position || undefined
      })) : undefined;

      const { data, error } = await api.enrollWithCompanions({
        training_id: training.id,
        officer_id: currentUserId,
        companions: companionsData
      });

      if (error) throw error;

      const companionCount = companions.length;
      const description = companionCount > 0 
        ? `You and ${companionCount} companion${companionCount > 1 ? 's' : ''} have been enrolled in the training.`
        : "You have been enrolled in the training.";

      toast({
        title: "Enrollment Successful",
        description,
      });

      // Call the success callback to update parent state
      onEnrollmentSuccess?.();

      setCompanions([]);
      setOpen(false);
    } catch (error) {
      console.error('Error enrolling:', error);
      toast({
        title: "Enrollment Failed",
        description: "Failed to enroll in training. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]" aria-describedby="enrollment-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enroll in Training
          </DialogTitle>
        </DialogHeader>
        <div id="enrollment-dialog-description" className="sr-only">
          Complete the enrollment form to register for this training session. You can optionally add up to 3 companions.
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{training.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Date:</strong> {new Date(training.start_date).toLocaleDateString()}</p>
                <p><strong>Venue:</strong> {training.venue}</p>
                <p><strong>Capacity:</strong> {training.capacity} participants</p>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Users className="h-4 w-4" />
                Bring fellow cooperative members (up to 3)
              </Label>
              <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={addCompanion}
                disabled={companions.length >= 3}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Companion
              </Button>
            </div>

            {companions.map((companion, index) => (
              <Card key={companion.id} className="border-dashed">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Companion {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCompanion(companion.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`companion-name-${companion.id}`}>Full Name *</Label>
                      <Input
                        id={`companion-name-${companion.id}`}
                        value={companion.name}
                        onChange={(e) => updateCompanion(companion.id, 'name', e.target.value)}
                        placeholder="Enter companion's full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`companion-email-${companion.id}`}>Email *</Label>
                      <Input
                        id={`companion-email-${companion.id}`}
                        type="email"
                        value={companion.email}
                        onChange={(e) => updateCompanion(companion.id, 'email', e.target.value)}
                        placeholder="companion@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`companion-phone-${companion.id}`}>Phone Number</Label>
                      <Input
                        id={`companion-phone-${companion.id}`}
                        value={companion.phone}
                        onChange={(e) => updateCompanion(companion.id, 'phone', e.target.value)}
                        placeholder="09XX XXX XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`companion-position-${companion.id}`}>Position in Cooperative</Label>
                      <Input
                        id={`companion-position-${companion.id}`}
                        value={companion.position}
                        onChange={(e) => updateCompanion(companion.id, 'position', e.target.value)}
                        placeholder="e.g., Treasurer, Member"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enrolling..." : "Enroll Now"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};