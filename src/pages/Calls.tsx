import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '@/lib/mock/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Eye, FileText, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Calls = () => {
  const navigate = useNavigate();

  const { data: calls = [] } = useQuery({
    queryKey: ['calls'],
    queryFn: () => mockApi.listCalls(),
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      completed: { className: 'bg-success/10 text-success border-success/20', label: 'Completed' },
      live: { className: 'bg-accent/10 text-accent border-accent/20', label: 'Live' },
      scheduled: { className: 'bg-accent-2/10 text-accent-2 border-accent-2/20', label: 'Scheduled' },
    };

    const variant = variants[status] || variants.completed;
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const getCoverageBadge = (coverage: number) => {
    if (coverage >= 80) {
      return <Badge className="bg-success/10 text-success border-success/20">{coverage}%</Badge>;
    } else if (coverage >= 60) {
      return <Badge className="bg-warning/10 text-warning border-warning/20">{coverage}%</Badge>;
    } else if (coverage > 0) {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{coverage}%</Badge>;
    }
    return <Badge variant="outline">—</Badge>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-primary">Call History</h1>
        <p className="text-subtext text-lg">Review and analyze your discovery calls</p>
      </motion.div>

      <Card className="card-elevated bg-white">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-subtext" />
              <Input placeholder="Search calls..." className="pl-10 bg-white border-border" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-border text-primary hover:bg-muted">
                <Clock className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button
                className="btn-accent"
                onClick={() => {
                  mockApi.createMeeting('New Discovery Call').then((meeting) => {
                    navigate(`/calls/${meeting.id}/live`);
                  });
                }}
              >
                Start New Call
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="font-semibold text-primary">Call</TableHead>
                <TableHead className="font-semibold text-primary">Date</TableHead>
                <TableHead className="font-semibold text-primary">Rep</TableHead>
                <TableHead className="font-semibold text-primary">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Coverage
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-primary">Duration</TableHead>
                <TableHead className="font-semibold text-primary">Status</TableHead>
                <TableHead className="font-semibold text-primary text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call, idx) => (
                <motion.tr
                  key={call.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium text-primary">{call.title}</TableCell>
                  <TableCell className="text-subtext">{formatDate(call.date)}</TableCell>
                  <TableCell className="text-subtext">{call.rep}</TableCell>
                  <TableCell>{getCoverageBadge(call.coverage)}</TableCell>
                  <TableCell className="text-subtext">
                    {call.duration > 0 ? `${call.duration}m` : '—'}
                  </TableCell>
                  <TableCell>{getStatusBadge(call.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {call.status === 'completed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border text-primary hover:bg-muted"
                            onClick={() => navigate(`/calls/${call.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border text-primary hover:bg-muted"
                            onClick={() => navigate(`/calls/${call.id}/transcript`)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Transcript
                          </Button>
                        </>
                      )}
                      {call.status === 'live' && (
                        <Button
                          size="sm"
                          className="btn-accent"
                          onClick={() => navigate(`/calls/${call.id}/live`)}
                        >
                          Join Live
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {calls.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-subtext opacity-50" />
            <h3 className="text-xl font-semibold mb-2 text-primary">No calls yet</h3>
            <p className="text-subtext mb-6">Start your first discovery call to see it here</p>
            <Button
              className="btn-accent"
              onClick={() => {
                mockApi.createMeeting('New Discovery Call').then((meeting) => {
                  navigate(`/calls/${meeting.id}/live`);
                });
              }}
            >
              Start New Call
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Calls;
