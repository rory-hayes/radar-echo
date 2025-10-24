-- Create enums
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.meeting_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.action_item_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.integration_provider AS ENUM ('hubspot', 'salesforce', 'zoom', 'google_calendar', 'outlook');
CREATE TYPE public.integration_status AS ENUM ('active', 'inactive', 'error');

-- User roles table with RBAC
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_user_roles_user_org ON public.user_roles(user_id, organization_id);
CREATE INDEX idx_user_roles_org ON public.user_roles(organization_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Org owners can manage roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.organization_id = user_roles.organization_id
      AND ur.role = 'owner'
    )
  );

-- Meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  participants JSONB NOT NULL DEFAULT '[]',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  recording_url TEXT,
  status meeting_status NOT NULL DEFAULT 'scheduled',
  framework_id UUID,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meetings_org ON public.meetings(organization_id);
CREATE INDEX idx_meetings_status ON public.meetings(status);
CREATE INDEX idx_meetings_created_by ON public.meetings(created_by);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view meetings"
  ON public.meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = meetings.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can create meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = meetings.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update meetings"
  ON public.meetings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = meetings.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- Transcripts table
CREATE TABLE public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  segments JSONB NOT NULL DEFAULT '[]',
  full_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transcripts_meeting ON public.transcripts(meeting_id);

ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view transcripts"
  ON public.transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.organization_members om ON om.organization_id = m.organization_id
      WHERE m.id = transcripts.meeting_id
      AND om.user_id = auth.uid()
    )
  );

-- Frameworks table
CREATE TABLE public.frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fields TEXT[] NOT NULL,
  questions JSONB NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_frameworks_org ON public.frameworks(organization_id);
CREATE INDEX idx_frameworks_active ON public.frameworks(is_active);

ALTER TABLE public.frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view default frameworks"
  ON public.frameworks FOR SELECT
  USING (is_default = true OR organization_id IS NULL);

CREATE POLICY "Org members can view org frameworks"
  ON public.frameworks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = frameworks.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can manage frameworks"
  ON public.frameworks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = frameworks.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Extractions table
CREATE TABLE public.extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  framework_field TEXT NOT NULL,
  value TEXT,
  confidence NUMERIC(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_extractions_meeting ON public.extractions(meeting_id);

ALTER TABLE public.extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view extractions"
  ON public.extractions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.organization_members om ON om.organization_id = m.organization_id
      WHERE m.id = extractions.meeting_id
      AND om.user_id = auth.uid()
    )
  );

-- Action items table
CREATE TABLE public.action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  text TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  status action_item_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_action_items_meeting ON public.action_items(meeting_id);
CREATE INDEX idx_action_items_status ON public.action_items(status);

ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view action items"
  ON public.action_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.organization_members om ON om.organization_id = m.organization_id
      WHERE m.id = action_items.meeting_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update action items"
  ON public.action_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.organization_members om ON om.organization_id = m.organization_id
      WHERE m.id = action_items.meeting_id
      AND om.user_id = auth.uid()
    )
  );

-- Integrations table
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  credentials JSONB NOT NULL,
  status integration_status NOT NULL DEFAULT 'inactive',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider)
);

CREATE INDEX idx_integrations_org ON public.integrations(organization_id);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage integrations"
  ON public.integrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = integrations.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Consent logs table
CREATE TABLE public.consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  participant_email TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_consent_logs_meeting ON public.consent_logs(meeting_id);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view consent logs"
  ON public.consent_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.organization_members om ON om.organization_id = m.organization_id
      WHERE m.id = consent_logs.meeting_id
      AND om.user_id = auth.uid()
    )
  );

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = audit_logs.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at
  BEFORE UPDATE ON public.transcripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_frameworks_updated_at
  BEFORE UPDATE ON public.frameworks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false);

CREATE POLICY "Org members can view recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'recordings' AND
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.organization_members om ON om.organization_id = m.organization_id
      WHERE m.recording_url LIKE '%' || storage.objects.name
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can upload recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recordings' AND
    auth.uid() IS NOT NULL
  );

-- Seed default frameworks
INSERT INTO public.frameworks (name, description, fields, questions, is_default, is_active, created_by) VALUES
('MEDDPICC', 'Comprehensive enterprise sales qualification framework', 
 ARRAY['Metrics', 'Economic Buyer', 'Decision Criteria', 'Decision Process', 'Paper Process', 'Identify Pain', 'Champion', 'Competition'],
 '{"Metrics": ["What specific metrics will this solution improve?", "What is the current baseline?", "What is the target improvement?"], "Economic Buyer": ["Who has the final authority to sign off on this purchase?", "Have we engaged with them directly?"], "Decision Criteria": ["What are the must-have requirements?", "What are the nice-to-have features?", "How will success be measured?"], "Decision Process": ["Who is involved in the decision?", "What is the approval workflow?", "What is the timeline?"], "Paper Process": ["What is the procurement process?", "Who handles legal review?", "What is the typical contract cycle?"], "Identify Pain": ["What business problem are they trying to solve?", "What is the cost of not solving it?", "What have they tried before?"], "Champion": ["Who is our internal advocate?", "Do they have influence?", "Are they invested in our success?"], "Competition": ["Who else are they evaluating?", "What is our differentiation?", "What are the competitive risks?"]}'::jsonb,
 true, true, (SELECT id FROM auth.users LIMIT 1)),
('BANT', 'Classic lead qualification framework focusing on Budget, Authority, Need, and Timeline',
 ARRAY['Budget', 'Authority', 'Need', 'Timeline'],
 '{"Budget": ["What is the allocated budget?", "Is budget approved?", "What is the budget cycle?"], "Authority": ["Who makes the final decision?", "Who influences the decision?"], "Need": ["What problem are they solving?", "How urgent is this need?", "What is the impact of not solving it?"], "Timeline": ["When do they need a solution?", "What drives the timeline?", "Are there any external deadlines?"]}'::jsonb,
 true, true, (SELECT id FROM auth.users LIMIT 1)),
('SPICED', 'Modern sales qualification framework emphasizing Situation, Pain, Impact, Critical Event, and Decision',
 ARRAY['Situation', 'Pain', 'Impact', 'Critical Event', 'Decision'],
 '{"Situation": ["What is their current situation?", "What tools are they using today?", "What is working and what is not?"], "Pain": ["What specific challenges are they facing?", "Who is most affected by these challenges?"], "Impact": ["What is the business impact of these challenges?", "What metrics are being affected?", "What is the cost of inaction?"], "Critical Event": ["What is driving them to look for a solution now?", "Is there a deadline or triggering event?"], "Decision": ["What is the decision-making process?", "Who needs to be involved?", "What criteria will they use to decide?"]}'::jsonb,
 true, true, (SELECT id FROM auth.users LIMIT 1));