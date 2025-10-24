import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { mockApi } from '@/lib/mock/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Mail, RefreshCw, Plus, Trash2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { ActionItem } from '@/lib/mock/data';

const CallDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [summary, setSummary] = useState('');

  const { data: call } = useQuery({
    queryKey: ['call', id],
    queryFn: () => mockApi.getCall(id!),
  });

  const { data: actionItems = [] } = useQuery({
    queryKey: ['actionItems', id],
    queryFn: () => mockApi.getActionItems(id!),
  });

  const { data: emailDraft } = useQuery({
    queryKey: ['emailDraft', id],
    queryFn: () => mockApi.getEmailDraft(id!),
  });

  const updateActionItemsMutation = useMutation({
    mutationFn: (items: ActionItem[]) => mockApi.updateActionItems(id!, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionItems', id] });
      toast({ title: 'Action items updated' });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => mockApi.syncToHubspot(id!),
    onSuccess: () => {
      toast({ title: 'Synced to HubSpot successfully' });
    },
  });

  const generateSummaryMutation = useMutation({
    mutationFn: () => mockApi.generateSummary(id!),
    onSuccess: (data) => {
      setSummary(data);
    },
  });

  const toggleActionItem = (itemId: string) => {
    const updated = actionItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateActionItemsMutation.mutate(updated);
  };

  const addActionItem = () => {
    const newItem: ActionItem = {
      id: `action-${Date.now()}`,
      text: 'New action item',
      owner: 'rep',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
    };
    updateActionItemsMutation.mutate([...actionItems, newItem]);
  };

  const removeActionItem = (itemId: string) => {
    updateActionItemsMutation.mutate(actionItems.filter((item) => item.id !== itemId));
  };

  if (!call) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <p className="text-subtext">Call not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Button
          variant="ghost"
          onClick={() => navigate('/calls')}
          className="mb-6 text-primary hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Calls
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-primary">{call.title}</h1>
          <div className="flex items-center gap-4 text-subtext">
            <span>{new Date(call.date).toLocaleDateString()}</span>
            <span>•</span>
            <span>{call.rep}</span>
            <span>•</span>
            <span>{call.duration}m</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="card-elevated bg-white p-6">
            <div className="text-subtext text-sm mb-1">MEDDPICC Coverage</div>
            <div className="text-3xl font-bold text-primary">{call.coverage}%</div>
          </Card>
          <Card className="card-elevated bg-white p-6">
            <div className="text-subtext text-sm mb-1">Talk Ratio</div>
            <div className="text-3xl font-bold text-primary">
              {call.talkRatio.rep}/{call.talkRatio.client}
            </div>
          </Card>
          <Card className="card-elevated bg-white p-6">
            <div className="text-subtext text-sm mb-1">Sentiment</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {call.sentiment === 'positive' ? '😊' : call.sentiment === 'neutral' ? '😐' : '😟'}
              </span>
              <span className="text-lg font-semibold text-primary capitalize">{call.sentiment}</span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-elevated bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary">AI Summary</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateSummaryMutation.mutate()}
                disabled={generateSummaryMutation.isPending}
                className="border-border text-primary hover:bg-muted"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generateSummaryMutation.isPending ? 'animate-spin' : ''}`} />
                {summary ? 'Regenerate' : 'Generate'}
              </Button>
            </div>
            {generateSummaryMutation.isPending ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
              </div>
            ) : summary ? (
              <div className="prose prose-sm max-w-none text-primary">
                <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }} />
              </div>
            ) : (
              <p className="text-subtext">Click generate to create an AI summary</p>
            )}
          </Card>

          <Card className="card-elevated bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary">Action Items</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={addActionItem}
                className="border-border text-primary hover:bg-muted"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleActionItem(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm text-primary ${item.completed ? 'line-through opacity-50' : ''}`}>
                      {item.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-subtext">
                      <Badge variant="outline" className="text-xs">
                        {item.owner === 'rep' ? 'Rep' : 'Client'}
                      </Badge>
                      <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeActionItem(item.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="card-elevated bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary">Follow-up Email</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (emailDraft) {
                    window.location.href = `mailto:?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`;
                  }
                }}
                className="border-border text-primary hover:bg-muted"
              >
                <Mail className="w-4 h-4 mr-2" />
                Open in Mail
              </Button>
            </div>
            {emailDraft && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-primary">Subject</label>
                  <Input value={emailDraft.subject} readOnly className="mt-1 bg-muted border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium text-primary">Body</label>
                  <Textarea
                    value={emailDraft.body}
                    readOnly
                    rows={8}
                    className="mt-1 bg-muted border-border"
                  />
                </div>
              </div>
            )}
          </Card>

          <Card className="card-elevated bg-white p-6">
            <h2 className="text-xl font-bold mb-4 text-primary">CRM Sync</h2>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-primary">HubSpot</p>
                  <p className="text-sm text-subtext">Last synced: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
              <Badge className="status-badge-success">Connected</Badge>
            </div>
            <Button
              className="btn-accent w-full"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default CallDetail;
