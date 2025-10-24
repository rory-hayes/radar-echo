import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { mockApi } from '@/lib/mock/server';
import { UPCOMING_MEETINGS } from '@/lib/mock/data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Clock, Smile, Play, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/use-subscription';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = useSubscription();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      toast({
        title: 'Subscription activated!',
        description: 'Your payment was successful. Welcome to Echo.',
      });
      // Remove session_id from URL
      navigate('/dashboard', { replace: true });
      // Refresh subscription status
      setTimeout(() => refreshSubscription(), 2000);
    }
  }, [searchParams, navigate, refreshSubscription]);

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => mockApi.getDashboard(),
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2 text-primary">Welcome back, Sarah</h1>
        <p className="text-subtext text-lg">Here's what's happening with your deals today.</p>
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        {/* Upcoming Meetings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-8"
        >
          <Card className="card-elevated p-6 bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-primary">Upcoming Meetings</h2>
              </div>
              <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {UPCOMING_MEETINGS.map((meeting, idx) => (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-muted/50 transition-all"
                >
                  <div>
                    <h3 className="font-semibold mb-1 text-primary">{meeting.title}</h3>
                    <p className="text-sm text-subtext">{meeting.time}</p>
                  </div>
                  <Button size="sm" className="btn-accent">
                    <Play className="w-4 h-4 mr-2" />
                    Join
                  </Button>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Performance Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 lg:col-span-4 space-y-4"
        >
          <Card className="card-elevated p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
              <TrendingUp className="w-5 h-5 text-primary" />
              Performance
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-subtext">MEDDPICC Coverage</span>
                  <span className="text-2xl font-bold text-accent">{dashboard?.avgCoverage || 0}%</span>
                </div>
                <Progress value={dashboard?.avgCoverage || 0} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-subtext">Talk Ratio</span>
                  <span className="text-lg font-semibold">
                    {dashboard?.avgTalkRatio || 0}/{100 - (dashboard?.avgTalkRatio || 0)}
                  </span>
                </div>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
                  <div className="bg-accent" style={{ width: `${dashboard?.avgTalkRatio || 0}%` }} />
                  <div className="bg-accent-2" style={{ width: `${100 - (dashboard?.avgTalkRatio || 0)}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-subtext flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Avg Call Length
                </span>
                <span className="text-lg font-semibold">{dashboard?.avgDuration || 0}m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-subtext flex items-center gap-2">
                  <Smile className="w-4 h-4" />
                  Sentiment
                </span>
                <Badge variant="outline" className="border-success text-success">
                  Positive
                </Badge>
              </div>
            </div>
          </Card>

          <Button
            className="w-full btn-accent"
            onClick={() => {
              mockApi.createMeeting('New Discovery Call').then((meeting) => {
                navigate(`/calls/${meeting.id}/live`);
              });
            }}
          >
            Start New Call
          </Button>
        </motion.div>

        {/* Recent Summaries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-12"
        >
          <Card className="card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Call Summaries</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/calls')} className="text-accent">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboard?.recentMeetings.map((meeting, idx) => (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  onClick={() => navigate(`/calls/${meeting.id}`)}
                  className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium group-hover:text-accent transition-colors">{meeting.title}</h3>
                    <Badge variant="outline" className="border-accent text-accent text-xs">
                      {meeting.coverage}%
                    </Badge>
                  </div>
                  <p className="text-sm text-subtext mb-2">{meeting.rep}</p>
                  <p className="text-xs text-subtext">{new Date(meeting.date).toLocaleDateString()}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
