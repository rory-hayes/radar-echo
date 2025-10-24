import { supabase } from '@/integrations/supabase/client';

export const processTranscript = async (
  meetingId: string,
  transcript: string,
  frameworkFields: any[]
) => {
  const { data, error } = await supabase.functions.invoke('process-transcript', {
    body: { meetingId, transcript, frameworkFields },
  });

  if (error) throw error;
  return data;
};

export const generateSummary = async (meetingId: string) => {
  const { data, error } = await supabase.functions.invoke('generate-summary', {
    body: { meetingId },
  });

  if (error) throw error;
  return data;
};

export const generateEmail = async (
  meetingId: string,
  summary: string,
  actionItems: any[]
) => {
  const { data, error } = await supabase.functions.invoke('generate-email', {
    body: { meetingId, summary, actionItems },
  });

  if (error) throw error;
  return data;
};

export const extractActionItems = async (
  meetingId: string,
  transcript: string
) => {
  const { data, error } = await supabase.functions.invoke('extract-action-items', {
    body: { meetingId, transcript },
  });

  if (error) throw error;
  return data;
};

export const exportUserData = async () => {
  const { data, error } = await supabase.functions.invoke('export-user-data', {});
  
  if (error) throw error;
  return data;
};

export const deleteUserData = async (confirmEmail: string) => {
  const { data, error } = await supabase.functions.invoke('delete-user-data', {
    body: { confirmEmail },
  });

  if (error) throw error;
  return data;
};