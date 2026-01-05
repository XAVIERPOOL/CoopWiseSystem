import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface TrainingSuggestionDialogProps {
  children: React.ReactNode;
}

export const TrainingSuggestionDialog: React.FC<TrainingSuggestionDialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    preferredDate: undefined as Date | undefined,
    justification: '',
    priority: 'medium'
  });
  
  const { toast } = useToast();

  const categories = [
    'Financial Management',
    'Governance Training',
    'Leadership Development',
    'Cooperative Principles',
    'Marketing and Sales',
    'Digital Literacy',
    'Human Resources',
    'Legal Compliance',
    'Project Management',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get officer ID from localStorage (in real app, would use proper auth)
      const officerId = localStorage.getItem('userId') || '11111111-1111-1111-1111-111111111111';

      // Insert training suggestion
      const { data, error } = await api.createTrainingSuggestion({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        preferred_date: formData.preferredDate?.toISOString().split('T')[0],
        justification: formData.justification,
        priority: formData.priority,
        officer_id: officerId
      });

      if (error) throw error;

      toast({
        title: "Suggestion Submitted",
        description: "Your training suggestion has been sent to administrators. They will review it shortly.",
      });

      setFormData({
        title: '',
        description: '',
        category: '',
        preferredDate: undefined,
        justification: '',
        priority: 'medium'
      });
      setOpen(false);
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to submit suggestion. Please try again.",
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Suggest a Training
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Training Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Advanced Financial Planning for Cooperatives"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this training should cover..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.preferredDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.preferredDate ? format(formData.preferredDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.preferredDate}
                  onSelect={(date) => setFormData({ ...formData, preferredDate: date })}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Justification</Label>
            <Textarea
              id="justification"
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              placeholder="Why is this training needed? How will it benefit your cooperative?"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Suggestion"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};