import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useActionItems = (meetingId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: actionItems, isLoading } = useQuery({
    queryKey: ['action-items', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];
      
      const { data, error } = await supabase
        .from('action_items' as any)
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!meetingId,
  });

  const updateActionItem = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('action_items' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-items'] });
      toast({
        title: 'Success',
        description: 'Action item updated',
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

  const completeActionItem = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('action_items' as any)
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-items'] });
      toast({
        title: 'Success',
        description: 'Action item marked as complete',
      });
    },
  });

  return {
    actionItems,
    isLoading,
    updateActionItem,
    completeActionItem,
  };
};