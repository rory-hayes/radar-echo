import {
  SEED_MEETINGS,
  SEED_TRANSCRIPTS,
  SEED_EXTRACTIONS,
  SEED_ACTION_ITEMS,
  SEED_EMAIL_DRAFTS,
  DEFAULT_FRAMEWORKS,
  Meeting,
  TranscriptSegment,
  Extraction,
  ActionItem,
  Framework,
} from './data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// LocalStorage keys
const STORAGE_KEYS = {
  meetings: 'echo_meetings',
  transcripts: 'echo_transcripts',
  extractions: 'echo_extractions',
  actionItems: 'echo_action_items',
  emailDrafts: 'echo_email_drafts',
  frameworks: 'echo_frameworks',
};

// Initialize localStorage with seed data if empty
const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.meetings)) {
    localStorage.setItem(STORAGE_KEYS.meetings, JSON.stringify(SEED_MEETINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.transcripts)) {
    localStorage.setItem(STORAGE_KEYS.transcripts, JSON.stringify(SEED_TRANSCRIPTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.extractions)) {
    localStorage.setItem(STORAGE_KEYS.extractions, JSON.stringify(SEED_EXTRACTIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.actionItems)) {
    localStorage.setItem(STORAGE_KEYS.actionItems, JSON.stringify(SEED_ACTION_ITEMS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.emailDrafts)) {
    localStorage.setItem(STORAGE_KEYS.emailDrafts, JSON.stringify(SEED_EMAIL_DRAFTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.frameworks)) {
    localStorage.setItem(STORAGE_KEYS.frameworks, JSON.stringify(DEFAULT_FRAMEWORKS));
  }
};

initStorage();

// Mock API functions
export const mockApi = {
  async getDashboard() {
    await delay(300);
    const meetings: Meeting[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.meetings) || '[]');
    const completed = meetings.filter((m) => m.status === 'completed');
    
    const avgCoverage = completed.length
      ? Math.round(completed.reduce((sum, m) => sum + m.coverage, 0) / completed.length)
      : 0;
    
    const avgTalkRatio = completed.length
      ? Math.round(completed.reduce((sum, m) => sum + m.talkRatio.rep, 0) / completed.length)
      : 0;
    
    const avgDuration = completed.length
      ? Math.round(completed.reduce((sum, m) => sum + m.duration, 0) / completed.length)
      : 0;

    return {
      avgCoverage,
      avgTalkRatio,
      avgDuration,
      recentMeetings: meetings.filter((m) => m.status === 'completed').slice(0, 3),
      sentiment: 'positive' as const,
    };
  },

  async listCalls() {
    await delay(200);
    const meetings: Meeting[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.meetings) || '[]');
    return meetings;
  },

  async getCall(id: string) {
    await delay(250);
    const meetings: Meeting[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.meetings) || '[]');
    return meetings.find((m) => m.id === id);
  },

  async getTranscript(id: string) {
    await delay(300);
    const transcripts: Record<string, TranscriptSegment[]> = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.transcripts) || '{}'
    );
    return transcripts[id] || [];
  },

  async getExtractions(id: string) {
    await delay(200);
    const extractions: Record<string, Extraction[]> = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.extractions) || '{}'
    );
    return extractions[id] || [];
  },

  async getActionItems(id: string) {
    await delay(200);
    const actionItems: Record<string, ActionItem[]> = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.actionItems) || '{}'
    );
    return actionItems[id] || [];
  },

  async updateActionItems(meetingId: string, items: ActionItem[]) {
    await delay(150);
    const actionItems: Record<string, ActionItem[]> = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.actionItems) || '{}'
    );
    actionItems[meetingId] = items;
    localStorage.setItem(STORAGE_KEYS.actionItems, JSON.stringify(actionItems));
    return items;
  },

  async getEmailDraft(id: string) {
    await delay(400);
    const drafts: Record<string, { subject: string; body: string }> = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.emailDrafts) || '{}'
    );
    return drafts[id] || { subject: '', body: '' };
  },

  async generateSummary(id: string) {
    await delay(800);
    return `## Key Discussion Points

- **Business Challenge**: Processing 10,000 orders/day with system limitations costing $50K/month
- **Decision Timeline**: Q1 2026 target implementation
- **Stakeholders**: CFO (final approval), VP Operations (influencer)
- **Budget**: Approved up to $200K annually

## Qualification

- ✅ Clear pain point with quantified impact
- ✅ Economic buyer identified (CFO)
- ✅ Defined timeline and budget
- ⚠️  Need to understand competition and decision criteria deeper

## Recommended Next Steps

1. Send technical architecture overview
2. Schedule demo with CFO and VP Operations
3. Obtain current system performance metrics from client`;
  },

  async syncToHubspot(meetingId: string) {
    await delay(600);
    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  },

  async listFrameworks() {
    await delay(150);
    const frameworks: Framework[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.frameworks) || '[]');
    return frameworks;
  },

  async saveFramework(framework: Framework) {
    await delay(200);
    const frameworks: Framework[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.frameworks) || '[]');
    const index = frameworks.findIndex((f) => f.id === framework.id);
    if (index >= 0) {
      frameworks[index] = framework;
    } else {
      frameworks.push(framework);
    }
    localStorage.setItem(STORAGE_KEYS.frameworks, JSON.stringify(frameworks));
    return framework;
  },

  async setActiveFramework(id: string) {
    await delay(150);
    const frameworks: Framework[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.frameworks) || '[]');
    frameworks.forEach((f) => {
      f.isActive = f.id === id;
    });
    localStorage.setItem(STORAGE_KEYS.frameworks, JSON.stringify(frameworks));
    return frameworks;
  },

  async createMeeting(title: string) {
    await delay(300);
    const meetings: Meeting[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.meetings) || '[]');
    const newMeeting: Meeting = {
      id: `meeting-${Date.now()}`,
      title,
      date: new Date().toISOString(),
      rep: 'Sarah Chen',
      duration: 0,
      coverage: 0,
      status: 'live',
      talkRatio: { rep: 0, client: 0 },
      sentiment: 'neutral',
    };
    meetings.unshift(newMeeting);
    localStorage.setItem(STORAGE_KEYS.meetings, JSON.stringify(meetings));
    return newMeeting;
  },

  async endMeeting(meetingId: string) {
    await delay(400);
    const meetings: Meeting[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.meetings) || '[]');
    const meeting = meetings.find((m) => m.id === meetingId);
    if (meeting) {
      meeting.status = 'completed';
      localStorage.setItem(STORAGE_KEYS.meetings, JSON.stringify(meetings));
    }
    return meeting;
  },
};
