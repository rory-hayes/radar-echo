import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Mic, Circle, StopCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
}

interface Extraction {
  field: string;
  value: string;
  confidence: number;
}

const CallLive = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const { data: meeting } = useQuery({
    queryKey: ['meeting', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (meeting?.status === 'in_progress') {
      setIsRecording(true);
    }
  }, [meeting]);

  const coverage = extractions.length > 0
    ? Math.round((extractions.filter((e) => e.confidence > 0.5).length / 7) * 100)
    : 0;

  const handleEndMeeting = async () => {
    setIsRecording(false);
    
    const { error } = await supabase
      .from('meetings')
      .update({ status: 'completed' })
      .eq('id', id!);

    if (error) {
      toast({ title: 'Error', description: 'Failed to end meeting', variant: 'destructive' });
      return;
    }

    toast({ title: 'Meeting ended', description: 'Redirecting to summary...' });
    setTimeout(() => {
      navigate(`/calls/${id}`);
    }, 1500);
  };

  if (!meeting) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <p className="text-subtext">Meeting not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b border-border bg-white px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/calls')}
              className="text-primary hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
            <div>
              <h1 className="text-xl font-bold text-primary">{meeting.title}</h1>
              <div className="flex items-center gap-2 text-sm text-subtext">
                {isRecording ? (
                  <>
                    <Circle className="w-2 h-2 fill-red-500 text-red-500 animate-pulse" />
                    <span>Recording</span>
                  </>
                ) : (
                  <span>Ready to record</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <Button
                onClick={() => setIsRecording(true)}
                className="btn-accent"
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleEndMeeting}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                End Meeting
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Transcript Column */}
              <Card className="card-elevated bg-white overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold text-primary">Live Transcript</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {!isRecording ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Mic className="w-16 h-16 mx-auto mb-4 text-subtext" />
                      <h3 className="text-lg font-semibold text-primary mb-2">Ready to Start</h3>
                      <p className="text-subtext">Click "Start Recording" to begin the call</p>
                    </div>
                  </div>
                ) : transcript.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Circle className="w-8 h-8 mx-auto mb-4 fill-red-500 text-red-500 animate-pulse" />
                      <p className="text-subtext">Listening for audio...</p>
                      <p className="text-xs text-subtext mt-2">Real-time transcription requires integration with a transcription service</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transcript.map((segment) => (
                      <motion.div
                        key={segment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-16 text-xs text-subtext pt-1">
                          {segment.timestamp}
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-sm text-primary block mb-1">{segment.speaker}</span>
                          <p className="text-sm text-primary leading-relaxed">{segment.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

              {/* Copilot Column */}
              <div className="flex flex-col gap-6 overflow-y-auto">
                {/* Framework Progress */}
                <Card className="card-elevated bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-primary">MEDDPICC Coverage</h2>
                  <span className="text-2xl font-bold text-accent">{coverage}%</span>
                </div>
                <Progress value={coverage} className="mb-6" />
                <div className="space-y-3">
                  {[
                    { field: 'Metrics', key: 'metrics' },
                    { field: 'Economic Buyer', key: 'economic_buyer' },
                    { field: 'Decision Criteria', key: 'decision_criteria' },
                    { field: 'Decision Process', key: 'decision_process' },
                    { field: 'Paper Process', key: 'paper_process' },
                    { field: 'Identify Pain', key: 'identify_pain' },
                    { field: 'Champion', key: 'champion' },
                  ].map((item) => {
                    const extraction = extractions.find((e) => e.field === item.key);
                    const status = !extraction
                      ? 'missing'
                      : extraction.confidence > 0.7
                      ? 'complete'
                      : 'partial';

                    return (
                      <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <span className="font-medium text-sm text-primary">{item.field}</span>
                        {status === 'complete' && (
                          <Badge className="status-badge-success">✓ Complete</Badge>
                        )}
                        {status === 'partial' && (
                          <Badge className="status-badge-warning">⚠ Partial</Badge>
                        )}
                        {status === 'missing' && (
                          <Badge className="status-badge-error">✗ Missing</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
                </Card>

                {/* Info Alert */}
                {isRecording && (
                  <Card className="card-elevated bg-accent/5 border-accent/20 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm text-primary mb-1">Real-time Transcription</h4>
                        <p className="text-sm text-subtext">
                          To enable live transcription, integrate with a service like AssemblyAI, Deepgram, or OpenAI Whisper.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallLive;
