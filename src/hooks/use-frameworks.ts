import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFrameworks = (organizationId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: frameworks, isLoading } = useQuery({
    queryKey: ['frameworks', organizationId],
    queryFn: async () => {
      let query = supabase
        .from('frameworks' as any)
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name');

      if (organizationId) {
        query = query.or(`organization_id.is.null,organization_id.eq.${organizationId}`);
      } else {
        query = query.is('organization_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const createFramework = useMutation({
    mutationFn: async (framework: {
      organization_id?: string;
      name: string;
      description?: string;
      fields: string[];
      questions: Record<string, string[]>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('frameworks' as any)
        .insert({
          ...framework,
          created_by: user.id,
          is_active: true,
          is_default: false,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frameworks'] });
      toast({
        title: 'Success',
        description: 'Framework created successfully',
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

  const updateFramework = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('frameworks' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frameworks'] });
      toast({
        title: 'Success',
        description: 'Framework updated successfully',
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

  const deleteFramework = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('frameworks' as any)
        .update({ is_active: false } as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frameworks'] });
      toast({
        title: 'Success',
        description: 'Framework deactivated successfully',
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
    frameworks,
    isLoading,
    createFramework,
    updateFramework,
    deleteFramework,
  };
};