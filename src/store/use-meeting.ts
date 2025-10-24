import { create } from 'zustand';
import { Meeting, TranscriptSegment, Extraction, ActionItem } from '@/lib/mock/data';

interface MeetingState {
  meetings: Meeting[];
  transcripts: Record<string, TranscriptSegment[]>;
  extractions: Record<string, Extraction[]>;
  actionItems: Record<string, ActionItem[]>;
  activeLiveSessionId: string | null;
  
  setMeetings: (meetings: Meeting[]) => void;
  setTranscript: (meetingId: string, segments: TranscriptSegment[]) => void;
  addTranscriptSegment: (meetingId: string, segment: TranscriptSegment) => void;
  setExtractions: (meetingId: string, extractions: Extraction[]) => void;
  addExtraction: (meetingId: string, extraction: Extraction) => void;
  setActionItems: (meetingId: string, items: ActionItem[]) => void;
  setActiveLiveSession: (meetingId: string | null) => void;
  updateMeetingCoverage: (meetingId: string, coverage: number) => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  meetings: [],
  transcripts: {},
  extractions: {},
  actionItems: {},
  activeLiveSessionId: null,
  
  setMeetings: (meetings) => set({ meetings }),
  
  setTranscript: (meetingId, segments) =>
    set((state) => ({
      transcripts: { ...state.transcripts, [meetingId]: segments },
    })),
  
  addTranscriptSegment: (meetingId, segment) =>
    set((state) => ({
      transcripts: {
        ...state.transcripts,
        [meetingId]: [...(state.transcripts[meetingId] || []), segment],
      },
    })),
  
  setExtractions: (meetingId, extractions) =>
    set((state) => ({
      extractions: { ...state.extractions, [meetingId]: extractions },
    })),
  
  addExtraction: (meetingId, extraction) =>
    set((state) => {
      const existing = state.extractions[meetingId] || [];
      const filtered = existing.filter((e) => e.field !== extraction.field);
      return {
        extractions: {
          ...state.extractions,
          [meetingId]: [...filtered, extraction],
        },
      };
    }),
  
  setActionItems: (meetingId, items) =>
    set((state) => ({
      actionItems: { ...state.actionItems, [meetingId]: items },
    })),
  
  setActiveLiveSession: (meetingId) =>
    set({ activeLiveSessionId: meetingId }),
  
  updateMeetingCoverage: (meetingId, coverage) =>
    set((state) => ({
      meetings: state.meetings.map((m) =>
        m.id === meetingId ? { ...m, coverage } : m
      ),
    })),
}));
