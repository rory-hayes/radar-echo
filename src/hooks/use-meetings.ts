import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMeetings = (organizationId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meetings, isLoading, error } = useQuery({
    queryKey: ['meetings', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('meetings' as any)
        .select(`
          *,
          transcripts(*),
          extractions(*),
          action_items(*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const createMeeting = useMutation({
    mutationFn: async (meeting: {
      organization_id: string;
      title: string;
      participants: any[];
      scheduled_at?: string;
      framework_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meetings' as any)
        .insert({
          ...meeting,
          created_by: user.id,
          status: 'scheduled',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({
        title: 'Success',
        description: 'Meeting created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('meetings' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({
        title: 'Success',
        description: 'Meeting updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMeeting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meetings' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({
        title: 'Success',
        description: 'Meeting deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    meetings,
    isLoading,
    error,
    createMeeting,
    updateMeeting,
    deleteMeeting,
  };
};

export const useMeeting = (id: string) => {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings' as any)
        .select(`
          *,
          transcripts(*),
          extractions(*),
          action_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};