
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Mail, 
  Building2, 
  UserCheck, 
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Officer {
  id: number;
  name: string;
  email: string;
  cooperative: string;
  position: string;
  complianceRate: number;
  status: string;
  lastTraining: string;
  missingRequirements: string[];
  completedTrainings: number;
  requiredTrainings: number;
}

interface EditOfficerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officer: Officer | null;
  onSave: (officer: Officer) => void;
}

const availableTrainings = [
  'Financial Management',
  'Governance Training',
  'Audit Training',
  'Risk Management',
  'Ethics Training',
  'Leadership Development',
  'Cooperative Principles',
  'Member Relations',
  'Strategic Planning',
  'Legal Compliance'
];

const EditOfficerDialog = ({ open, onOpenChange, officer, onSave }: EditOfficerDialogProps) => {
  const [editedOfficer, setEditedOfficer] = useState<Officer | null>(officer);
  const [assignedTrainings, setAssignedTrainings] = useState<string[]>([]);

  React.useEffect(() => {
    if (officer) {
      setEditedOfficer({ ...officer });
      // Set assigned trainings as the ones not missing
      const completed = availableTrainings.filter(
        training => !officer.missingRequirements.includes(training)
      );
      setAssignedTrainings(completed);
    }
  }, [officer]);

  const handleInputChange = (field: keyof Officer, value: string | number) => {
    if (!editedOfficer) return;
    setEditedOfficer({
      ...editedOfficer,
      [field]: value
    });
  };

  const handleTrainingToggle = (training: string, isChecked: boolean) => {
    if (isChecked) {
      setAssignedTrainings(prev => [...prev, training]);
    } else {
      setAssignedTrainings(prev => prev.filter(t => t !== training));
    }
  };

  const calculateComplianceRate = () => {
    if (!editedOfficer) return 0;
    return Math.round((assignedTrainings.length / availableTrainings.length) * 100);
  };

  const getComplianceStatus = (rate: number) => {
    if (rate >= 90) return 'compliant';
    if (rate >= 50) return 'partial';
    return 'non-compliant';
  };

  const handleSave = () => {
    if (!editedOfficer) return;

    const missingRequirements = availableTrainings.filter(
      training => !assignedTrainings.includes(training)
    );
    
    const complianceRate = calculateComplianceRate();
    const status = getComplianceStatus(complianceRate);

    const updatedOfficer: Officer = {
      ...editedOfficer,
      missingRequirements,
      completedTrainings: assignedTrainings.length,
      requiredTrainings: availableTrainings.length,
      complianceRate,
      status
    };

    onSave(updatedOfficer);
    toast({
      title: "Officer Updated",
      description: `${editedOfficer.name}'s compliance record has been updated successfully.`,
    });
    onOpenChange(false);
  };

  if (!editedOfficer) return null;

  const currentComplianceRate = calculateComplianceRate();
  const currentStatus = getComplianceStatus(currentComplianceRate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Edit Officer Compliance
          </DialogTitle>
          <DialogDescription>
            Update officer information and assign training requirements
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Officer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Officer Information
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editedOfficer.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={editedOfficer.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cooperative">Cooperative</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="cooperative"
                    value={editedOfficer.cooperative}
                    onChange={(e) => handleInputChange('cooperative', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={editedOfficer.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                />
              </div>
            </div>

            {/* Current Compliance Status */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Updated Compliance Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Progress</span>
                  <Badge className={
                    currentStatus === 'compliant' ? 'bg-green-100 text-green-800' :
                    currentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {currentComplianceRate}%
                  </Badge>
                </div>
                <Progress value={currentComplianceRate} className="h-2" />
                <p className="text-xs text-gray-600">
                  {assignedTrainings.length}/{availableTrainings.length} trainings assigned
                </p>
              </div>
            </div>
          </div>

          {/* Training Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Training Assignment</h3>
            <p className="text-sm text-gray-600">
              Select the trainings that this officer has completed or should complete
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableTrainings.map((training) => {
                const isAssigned = assignedTrainings.includes(training);
                const wasMissing = officer?.missingRequirements.includes(training);
                
                return (
                  <div key={training} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={training}
                      checked={isAssigned}
                      onCheckedChange={(checked) => 
                        handleTrainingToggle(training, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={training}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {training}
                      </Label>
                      {wasMissing && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600">Previously missing</span>
                        </div>
                      )}
                    </div>
                    {isAssigned && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditOfficerDialog;
