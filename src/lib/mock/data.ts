export interface Meeting {
  id: string;
  title: string;
  date: string;
  rep: string;
  duration: number;
  coverage: number;
  status: 'completed' | 'live' | 'scheduled';
  talkRatio: { rep: number; client: number };
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  tags: string[];
}

export interface Extraction {
  field: string;
  value: string;
  confidence: number;
}

export interface Framework {
  id: string;
  name: string;
  fields: FrameworkField[];
  isActive: boolean;
}

export interface FrameworkField {
  key: string;
  label: string;
  prompt: string;
  required: boolean;
  questions: string[];
}

export interface ActionItem {
  id: string;
  text: string;
  owner: 'rep' | 'client';
  dueDate?: string;
  completed: boolean;
}

// Seed data
export const SEED_MEETINGS: Meeting[] = [
  {
    id: 'meeting-1',
    title: 'Discovery Call - Acme Corp',
    date: '2025-10-22T14:00:00Z',
    rep: 'Sarah Chen',
    duration: 42,
    coverage: 85,
    status: 'completed',
    talkRatio: { rep: 46, client: 54 },
    sentiment: 'positive',
  },
  {
    id: 'meeting-2',
    title: 'Demo - TechStart Inc',
    date: '2025-10-23T10:30:00Z',
    rep: 'Michael Rodriguez',
    duration: 38,
    coverage: 72,
    status: 'completed',
    talkRatio: { rep: 52, client: 48 },
    sentiment: 'neutral',
  },
  {
    id: 'meeting-3',
    title: 'Follow-up - GlobalTech',
    date: '2025-10-24T15:00:00Z',
    rep: 'Sarah Chen',
    duration: 0,
    coverage: 0,
    status: 'scheduled',
    talkRatio: { rep: 0, client: 0 },
    sentiment: 'neutral',
  },
];

export const SEED_TRANSCRIPTS: Record<string, TranscriptSegment[]> = {
  'meeting-1': [
    {
      id: 'seg-1',
      speaker: 'Sarah Chen',
      text: "Thanks for joining today. I'm excited to learn more about your current challenges with order processing.",
      timestamp: 0,
      tags: [],
    },
    {
      id: 'seg-2',
      speaker: 'John Smith',
      text: "Absolutely. We're processing about 10,000 orders per day and our current system is struggling. We need something that scales.",
      timestamp: 3.2,
      tags: ['pain', 'metrics'],
    },
    {
      id: 'seg-3',
      speaker: 'Sarah Chen',
      text: "That's a significant volume. Walk me through what happens when your system struggles - what does that look like operationally?",
      timestamp: 9.8,
      tags: [],
    },
    {
      id: 'seg-4',
      speaker: 'John Smith',
      text: "Orders get delayed, customer service gets flooded with calls, and our warehouse team can't keep up. It's costing us about $50K per month in lost productivity.",
      timestamp: 15.1,
      tags: ['pain', 'economic', 'metrics'],
    },
    {
      id: 'seg-5',
      speaker: 'Sarah Chen',
      text: "That's substantial. Who else is affected by this besides your warehouse and CS teams?",
      timestamp: 22.5,
      tags: [],
    },
    {
      id: 'seg-6',
      speaker: 'John Smith',
      text: "The CFO is very concerned. She's been pushing for a solution for the last quarter. We also need buy-in from our VP of Operations.",
      timestamp: 27.3,
      tags: ['decision-makers', 'champion'],
    },
    {
      id: 'seg-7',
      speaker: 'Sarah Chen',
      text: "Makes sense. What's your timeline for making a decision? And what does the approval process typically look like at Acme?",
      timestamp: 34.8,
      tags: [],
    },
    {
      id: 'seg-8',
      speaker: 'John Smith',
      text: "We need something in place by Q1 next year. The CFO has final sign-off, but I'll present the options with the VP of Ops. Budget is approved for up to $200K annually.",
      timestamp: 40.2,
      tags: ['timeline', 'decision-criteria', 'economic'],
    },
  ],
};

export const SEED_EXTRACTIONS: Record<string, Extraction[]> = {
  'meeting-1': [
    { field: 'metrics', value: '10,000 orders/day, $50K monthly cost', confidence: 0.95 },
    { field: 'economic-buyer', value: 'CFO', confidence: 0.92 },
    { field: 'decision-criteria', value: 'Scalability, Q1 timeline', confidence: 0.88 },
    { field: 'decision-process', value: 'CFO final approval, VP Ops input', confidence: 0.85 },
    { field: 'paper-process', value: 'Budget approved up to $200K/year', confidence: 0.9 },
    { field: 'identify-pain', value: 'Order delays, CS overload, warehouse backup', confidence: 0.93 },
    { field: 'champion', value: 'VP of Operations', confidence: 0.8 },
  ],
};

export const SEED_ACTION_ITEMS: Record<string, ActionItem[]> = {
  'meeting-1': [
    {
      id: 'action-1',
      text: 'Send technical architecture overview to John',
      owner: 'rep',
      dueDate: '2025-10-25',
      completed: false,
    },
    {
      id: 'action-2',
      text: 'Schedule call with CFO and VP Ops for demo',
      owner: 'rep',
      dueDate: '2025-10-27',
      completed: false,
    },
    {
      id: 'action-3',
      text: 'Provide current system performance metrics',
      owner: 'client',
      dueDate: '2025-10-26',
      completed: false,
    },
  ],
};

export const SEED_EMAIL_DRAFTS: Record<string, { subject: string; body: string }> = {
  'meeting-1': {
    subject: 'Next Steps - Acme Corp Discovery Call',
    body: `Hi John,

Thank you for the productive discussion today. Based on our conversation, I wanted to summarize the key points and outline next steps:

**Key Takeaways:**
- Processing 10,000 orders/day with current system limitations
- $50K/month in lost productivity from delays and overflow
- Q1 2026 target for new solution
- CFO approval with VP Operations input required

**Next Steps:**
1. I'll send over our technical architecture overview by Friday
2. Let's schedule a demo with your CFO and VP of Ops for next week
3. Please share your current system performance metrics when you have a chance

Looking forward to showing you how Echo can help streamline your order processing and eliminate those bottlenecks.

Best regards,
Sarah`,
  },
};

export const DEFAULT_FRAMEWORKS: Framework[] = [
  {
    id: 'meddpicc',
    name: 'MEDDPICC',
    isActive: true,
    fields: [
      {
        key: 'metrics',
        label: 'Metrics',
        prompt: 'Extract quantifiable business metrics, KPIs, or numerical impact',
        required: true,
        questions: [
          'What specific metrics are you trying to improve?',
          'How do you measure success today?',
          'What would a 10% improvement mean for your business?',
        ],
      },
      {
        key: 'economic-buyer',
        label: 'Economic Buyer',
        prompt: 'Identify who has budget authority and final spending approval',
        required: true,
        questions: [
          'Who has the final say on budget for this project?',
          'Who typically approves investments of this size?',
          'Can you walk me through your approval process?',
        ],
      },
      {
        key: 'decision-criteria',
        label: 'Decision Criteria',
        prompt: 'Capture the criteria and requirements used to evaluate solutions',
        required: true,
        questions: [
          'What are your must-haves vs. nice-to-haves?',
          'How will you evaluate different solutions?',
          'What would make this a clear win for your team?',
        ],
      },
      {
        key: 'decision-process',
        label: 'Decision Process',
        prompt: 'Map out the steps and stakeholders in the buying process',
        required: true,
        questions: [
          'Walk me through how decisions like this typically get made',
          'Who needs to be involved at each stage?',
          'What could slow down or derail this process?',
        ],
      },
      {
        key: 'paper-process',
        label: 'Paper Process',
        prompt: 'Understand the procurement, legal, and contracting process',
        required: false,
        questions: [
          'What does the contracting process look like?',
          'Are there any procurement or legal requirements?',
          'What documents or approvals are needed?',
        ],
      },
      {
        key: 'identify-pain',
        label: 'Identify Pain',
        prompt: 'Uncover the business problems and pain points driving this purchase',
        required: true,
        questions: [
          "What happens if you don't solve this problem?",
          'How is this impacting your team day-to-day?',
          'What triggered you to start looking for a solution now?',
        ],
      },
      {
        key: 'champion',
        label: 'Champion',
        prompt: 'Identify internal advocates who will sell on your behalf',
        required: true,
        questions: [
          'Who internally is most excited about this project?',
          'Who will help us navigate the organization?',
          'Who stands to benefit most from this solution?',
        ],
      },
      {
        key: 'competition',
        label: 'Competition',
        prompt: 'Understand competitive alternatives and preferences',
        required: false,
        questions: [
          'What other solutions are you evaluating?',
          'Have you worked with any of these vendors before?',
          'What do you like or dislike about the alternatives?',
        ],
      },
    ],
  },
  {
    id: 'bant',
    name: 'BANT',
    isActive: false,
    fields: [
      {
        key: 'budget',
        label: 'Budget',
        prompt: 'Determine if budget is allocated or available',
        required: true,
        questions: ['What budget have you allocated for this?', 'Is budget approved or do we need to build a case?'],
      },
      {
        key: 'authority',
        label: 'Authority',
        prompt: 'Identify decision-makers and approval process',
        required: true,
        questions: ['Who makes the final decision?', 'Who else is involved in the approval?'],
      },
      {
        key: 'need',
        label: 'Need',
        prompt: 'Understand the problem and urgency',
        required: true,
        questions: ['What problem are you trying to solve?', "What happens if you don't address this?"],
      },
      {
        key: 'timeline',
        label: 'Timeline',
        prompt: 'Establish when they need to implement',
        required: true,
        questions: ['When do you need this in place?', "What's driving that timeline?"],
      },
    ],
  },
];

export const UPCOMING_MEETINGS = [
  {
    id: 'upcoming-1',
    title: 'Discovery - DataFlow Systems',
    time: 'Today, 4:00 PM',
    attendees: ['Sarah Chen', 'Mike Johnson (DataFlow)'],
  },
  {
    id: 'upcoming-2',
    title: 'Demo - CloudScale Inc',
    time: 'Tomorrow, 11:00 AM',
    attendees: ['Michael Rodriguez', 'Amy Park (CloudScale)'],
  },
];

export const LIVE_SUGGESTIONS = [
  "Ask: Who else besides the CFO needs to sign off on this decision, and what's important to them?",
  "Ask: What happens if you don't solve this by Q1? What's the business impact?",
  "Ask: Have you evaluated any other solutions? What did you like or not like about them?",
  "Ask: Walk me through how a typical order flows through your system today.",
  "Ask: Beyond the VP of Operations, who else will be affected by this change?",
];

export const BATTLECARD_COMPETITOR = {
  name: 'CompetitorX',
  strengths: ['Established market presence', 'Lower upfront cost', 'Simple UI'],
  weaknesses: ['Limited scalability', 'Poor customer support', 'No real-time analytics'],
  positioning: 'Emphasize our real-time capabilities, scalability, and dedicated support model.',
};
