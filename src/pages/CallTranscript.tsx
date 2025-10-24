import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { mockApi } from '@/lib/mock/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Download, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const CallTranscript = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: call } = useQuery({
    queryKey: ['call', id],
    queryFn: () => mockApi.getCall(id!),
  });

  const { data: transcript = [] } = useQuery({
    queryKey: ['transcript', id],
    queryFn: () => mockApi.getTranscript(id!),
  });

  const filteredTranscript = transcript.filter(
    (segment) =>
      segment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      segment.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadTranscript = (format: 'txt' | 'pdf') => {
    const content = transcript
      .map((seg) => `[${seg.timestamp}] ${seg.speaker}: ${seg.text}`)
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${id}.${format}`;
    a.click();
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
          <h1 className="text-4xl font-bold mb-2 text-primary">{call.title} - Transcript</h1>
          <div className="flex items-center gap-4 text-subtext">
            <span>{new Date(call.date).toLocaleDateString()}</span>
            <span>•</span>
            <span>{call.rep}</span>
            <span>•</span>
            <span>{call.duration}m</span>
          </div>
        </div>

        <Card className="card-elevated bg-white p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-subtext" />
              <Input
                placeholder="Search transcript..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-border"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTranscript('txt')}
                className="border-border text-primary hover:bg-muted"
              >
                <Download className="w-4 h-4 mr-2" />
                TXT
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTranscript('pdf')}
                className="border-border text-primary hover:bg-muted"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </Card>

        <Card className="card-elevated bg-white p-6 mb-6">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="border-border text-primary hover:bg-muted"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <div className="flex-1">
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-accent w-1/3 transition-all" />
              </div>
            </div>
            <span className="text-sm text-subtext">12:34 / {call.duration}:00</span>
          </div>
        </Card>

        <Card className="card-elevated bg-white">
          <div className="divide-y divide-border">
            {filteredTranscript.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-subtext">No transcript segments found</p>
              </div>
            ) : (
              filteredTranscript.map((segment, idx) => (
                <motion.div
                  key={segment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="p-6 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-20 flex-shrink-0">
                      <span className="text-sm text-subtext">{segment.timestamp}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-primary">{segment.speaker}</span>
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
                      <p className="text-primary leading-relaxed">{segment.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default CallTranscript;
