import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useMeetings } from '@/hooks/use-meetings';
import { useFrameworks } from '@/hooks/use-frameworks';
import { useOrganization } from '@/hooks/use-organization';

export const CreateMeetingDialog = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [frameworkId, setFrameworkId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const { organization } = useOrganization();
  const { frameworks } = useFrameworks(organization?.id);
  const { createMeeting } = useMeetings(organization?.id);

  const handleAddParticipant = () => {
    if (participantEmail && !participants.includes(participantEmail)) {
      setParticipants([...participants, participantEmail]);
      setParticipantEmail('');
    }
  };

  const handleRemoveParticipant = (email: string) => {
    setParticipants(participants.filter(p => p !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organization) return;

    await createMeeting.mutateAsync({
      organization_id: organization.id,
      title,
      participants: participants.map(email => ({ email })),
      scheduled_at: scheduledAt || undefined,
      framework_id: frameworkId || undefined,
    });

    // Reset form
    setTitle('');
    setParticipants([]);
    setFrameworkId('');
    setScheduledAt('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Discovery Call with Acme Corp"
              required
            />
          </div>

          <div>
            <Label htmlFor="framework">Framework (Optional)</Label>
            <Select value={frameworkId} onValueChange={setFrameworkId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a framework" />
              </SelectTrigger>
              <SelectContent>
                {frameworks?.map((fw: any) => (
                  <SelectItem key={fw.id} value={fw.id}>
                    {fw.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="scheduled">Scheduled Time (Optional)</Label>
            <Input
              id="scheduled"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div>
            <Label>Participants</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                placeholder="Email address"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddParticipant();
                  }
                }}
              />
              <Button type="button" onClick={handleAddParticipant} variant="outline">
                Add
              </Button>
            </div>
            {participants.length > 0 && (
              <div className="mt-2 space-y-1">
                {participants.map((email) => (
                  <div key={email} className="flex items-center justify-between bg-muted p-2 rounded">
                    <span className="text-sm">{email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveParticipant(email)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMeeting.isPending}>
              {createMeeting.isPending ? 'Creating...' : 'Create Meeting'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};