import { TranscriptSegment, LIVE_SUGGESTIONS } from './data';

const MOCK_UTTERANCES = [
  { speaker: 'Rep', text: 'Thanks for joining today. How have things been going with your current setup?', tags: [] },
  {
    speaker: 'Client',
    text: "We're seeing about 15% growth quarter over quarter, but our systems are struggling to keep up.",
    tags: ['metrics', 'pain'],
  },
  { speaker: 'Rep', text: "That's impressive growth. What specific challenges are you facing?", tags: [] },
  {
    speaker: 'Client',
    text: "Our processing times have doubled and we're getting customer complaints. It's costing us roughly $75K per month.",
    tags: ['pain', 'metrics', 'economic'],
  },
  { speaker: 'Rep', text: 'Who else is impacted by these delays besides your customers?', tags: [] },
  {
    speaker: 'Client',
    text: 'Our operations team is overwhelmed, and the COO has been asking about solutions weekly. The CEO wants this resolved by end of year.',
    tags: ['decision-makers', 'timeline'],
  },
  { speaker: 'Rep', text: 'What would success look like for you?', tags: [] },
  {
    speaker: 'Client',
    text: 'We need to cut processing time by at least 50% and handle our projected growth without adding headcount.',
    tags: ['decision-criteria', 'metrics'],
  },
  { speaker: 'Rep', text: "What's your budget range for solving this?", tags: [] },
  {
    speaker: 'Client',
    text: "We have $250K approved for this fiscal year. The CFO has final say, but I'll make the recommendation.",
    tags: ['economic', 'decision-process'],
  },
];

export interface LiveSessionConfig {
  meetingId: string;
  onChunk: (segment: TranscriptSegment) => void;
  onExtraction: (field: string, value: string, confidence: number) => void;
  onSuggestion: (suggestion: string) => void;
}

export const startLiveSession = ({ meetingId, onChunk, onExtraction, onSuggestion }: LiveSessionConfig) => {
  let stopped = false;
  let chunkIndex = 0;
  let suggestionIndex = 0;
  let timestamp = 0;

  const emitChunk = () => {
    if (stopped) return;

    const utterance = MOCK_UTTERANCES[chunkIndex % MOCK_UTTERANCES.length];
    const segment: TranscriptSegment = {
      id: `seg-${Date.now()}-${chunkIndex}`,
      speaker: utterance.speaker,
      text: utterance.text,
      timestamp,
      tags: utterance.tags,
    };

    onChunk(segment);

    // Emit extractions for tagged segments
    if (utterance.tags.length > 0) {
      setTimeout(() => {
        if (!stopped) {
          utterance.tags.forEach((tag) => {
            const confidence = 0.75 + Math.random() * 0.2;
            onExtraction(tag, utterance.text, confidence);
          });
        }
      }, 800);
    }

    timestamp += utterance.text.length * 0.05;
    chunkIndex++;

    const nextDelay = 4000 + Math.random() * 3000;
    setTimeout(emitChunk, nextDelay);
  };

  const emitSuggestion = () => {
    if (stopped) return;
    const suggestion = LIVE_SUGGESTIONS[suggestionIndex % LIVE_SUGGESTIONS.length];
    onSuggestion(suggestion);
    suggestionIndex++;

    const nextDelay = 60000 + Math.random() * 30000;
    setTimeout(emitSuggestion, nextDelay);
  };

  // Start streaming
  setTimeout(emitChunk, 2000);
  setTimeout(emitSuggestion, 15000);

  return () => {
    stopped = true;
  };
};
