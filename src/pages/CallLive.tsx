import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { mockApi } from '@/lib/mock/server';
import { startLiveSession } from '@/lib/mock/ws';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Copy, X, Lightbulb, AlertCircle, Circle, Bookmark, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { TranscriptSegment, Extraction } from '@/lib/mock/data';

const CallLive = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(true);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const stopSessionRef = useRef<(() => void) | null>(null);

  const { data: call } = useQuery({
    queryKey: ['call', id],
    queryFn: () => mockApi.getCall(id!),
  });

  useEffect(() => {
    if (id) {
      const stopSession = startLiveSession({
        meetingId: id,
        onChunk: (segment) => {
          setTranscript((prev) => [...prev, segment]);
          transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        },
        onExtraction: (field, value, confidence) => {
          const extraction: Extraction = { field, value, confidence };
          setExtractions((prev) => {
            const existing = prev.findIndex((e) => e.field === field);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = extraction;
              return updated;
            }
            return [...prev, extraction];
          });
        },
        onSuggestion: (suggestion) => {
          setCurrentSuggestion(suggestion);
        },
      });

      stopSessionRef.current = stopSession;

      return () => {
        if (stopSessionRef.current) {
          stopSessionRef.current();
        }
      };
    }
  }, [id]);

  const coverage = extractions.length > 0
    ? Math.round((extractions.filter((e) => e.confidence > 0.5).length / 7) * 100)
    : 0;

  const handleAskQuestion = () => {
    if (currentSuggestion) {
      navigator.clipboard.writeText(currentSuggestion.text);
      toast({ title: 'Question copied to clipboard' });
    }
  };

  const handleEndMeeting = async () => {
    setIsRecording(false);
    if (stopSessionRef.current) {
      stopSessionRef.current();
    }
    await mockApi.endMeeting(id!);
    toast({ title: 'Meeting ended', description: 'Generating summary...' });
    setTimeout(() => {
      navigate(`/calls/${id}`);
    }, 1500);
  };

  if (!call) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <p className="text-subtext">Call not found</p>
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
              <h1 className="text-xl font-bold text-primary">{call.title}</h1>
              <div className="flex items-center gap-2 text-sm text-subtext">
                <Circle className="w-2 h-2 fill-red-500 text-red-500 animate-pulse" />
                <span>Live Recording</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-border text-primary hover:bg-muted"
            >
              <Bookmark className="w-4 h-4 mr-2" />
              Bookmark
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndMeeting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              End Meeting
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Transcript Column */}
            <Card className="card-elevated bg-white overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold text-primary">Live Transcript</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {transcript.map((segment, idx) => (
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-primary">{segment.speaker}</span>
                        {segment.tags && segment.tags.length > 0 && (
                          <div className="flex gap-1">
                            {segment.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs bg-accent/10 text-accent border-accent/20"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-primary leading-relaxed">{segment.text}</p>
                    </div>
                  </motion.div>
                ))}
                <div ref={transcriptEndRef} />
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

              {/* Suggestion Card */}
              <AnimatePresence>
                {currentSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="card-elevated bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-bold text-primary mb-2">Next Best Question</h3>
                          <p className="text-sm text-primary leading-relaxed">{currentSuggestion.text}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentSuggestion(null)}
                          className="text-subtext hover:text-primary"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="btn-accent flex-1"
                          onClick={handleAskQuestion}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Question
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentSuggestion(null)}
                          className="border-border text-primary hover:bg-muted"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Alerts */}
              {transcript.length > 10 && (
                <Card className="card-elevated bg-warning/5 border-warning/20 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-1">Monologue Alert</h4>
                      <p className="text-sm text-subtext">
                        You've been talking for 3+ minutes. Consider asking a question to engage the prospect.
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
  );
};

export default CallLive;
