import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Mail, MoreVertical, Crown, Shield, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).max(255),
  role: z.enum(['admin', 'member', 'viewer']),
});

type Member = {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
};

const Team = () => {
  const navigate = useNavigate();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', session.user.id)
      .single();

    if (!membership) {
      toast({
        title: 'No organization found',
        description: 'You need to be part of an organization to manage team members.',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    setCurrentOrgId(membership.organization_id);

    // Load members with profile data
    const { data: membersData, error: membersError } = await supabase
      .from('organization_members')
      .select('id, user_id, role, joined_at')
      .eq('organization_id', membership.organization_id);

    if (membersData) {
      // Fetch profiles for each member
      const membersWithProfiles = await Promise.all(
        membersData.map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', member.user_id)
            .single();

          return {
            ...member,
            profiles: profile || { full_name: null, email: '' },
          };
        })
      );

      setMembers(membersWithProfiles as Member[]);
    }

    // Load pending invitations
    const { data: invitationsData } = await supabase
      .from('invitations')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .eq('status', 'pending');

    if (invitationsData) {
      setInvitations(invitationsData);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = inviteSchema.parse({ email: inviteEmail, role: inviteRole });

      if (!currentOrgId) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Generate invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase
        .from('invitations')
        .insert({
          organization_id: currentOrgId,
          email: validated.email,
          role: validated.role,
          invited_by: session.user.id,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Invitation sent!',
        description: `An invitation has been sent to ${validated.email}`,
      });

      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('member');
      loadTeamData();
    } catch (error: any) {
      if (error.errors) {
        toast({
          title: 'Validation error',
          description: error.errors[0]?.message || 'Please check your input',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Invitation failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-accent" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-primary" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-subtext" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    const config = {
      owner: { label: 'Owner', className: 'bg-accent text-white' },
      admin: { label: 'Admin', className: 'bg-primary/10 text-primary' },
      member: { label: 'Member', className: 'bg-muted text-primary' },
      viewer: { label: 'Viewer', className: 'bg-muted/50 text-subtext' },
    };

    const { label, className } = config[role as keyof typeof config] || config.member;
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-primary">Team Management</h1>
            <p className="text-subtext text-lg">Manage your organization members and invitations</p>
          </div>
          <Button className="btn-accent" onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </motion.div>

      {/* Members List */}
      <Card className="card-elevated bg-white p-6 mb-6">
        <h2 className="text-2xl font-bold text-primary mb-6">Team Members</h2>
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-accent text-white">
                    {member.profiles.full_name?.[0] || member.profiles.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-primary">{member.profiles.full_name || 'No name'}</p>
                    {getRoleIcon(member.role)}
                  </div>
                  <p className="text-sm text-subtext">{member.profiles.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getRoleBadge(member.role)}
                <Button variant="ghost" size="icon" className="text-subtext hover:text-primary">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card className="card-elevated bg-white p-6">
          <h2 className="text-2xl font-bold text-primary mb-6">Pending Invitations</h2>
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="w-5 h-5 text-subtext" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">{invitation.email}</p>
                    <p className="text-sm text-subtext">Invited {new Date(invitation.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getRoleBadge(invitation.role)}
                  <Badge variant="outline" className="text-warning border-warning">
                    Pending
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">Invite Team Member</DialogTitle>
            <DialogDescription className="text-subtext">
              Send an invitation to join your organization
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email" className="text-primary">
                  Email Address
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="bg-white border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role" className="text-primary">
                  Role
                </Label>
                <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                  <SelectTrigger className="bg-white border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="admin">Admin - Full access</SelectItem>
                    <SelectItem value="member">Member - Standard access</SelectItem>
                    <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
                className="border-border text-primary hover:bg-muted"
              >
                Cancel
              </Button>
              <Button type="submit" className="btn-accent" disabled={isLoading}>
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;