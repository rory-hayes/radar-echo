import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOrganization = () => {
  const { data: currentOrg, isLoading } = useQuery({
    queryKey: ['current-organization'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get user's organization memberships
      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(*)')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (memberError || !memberships) return null;
      return memberships.organizations;
    },
  });

  const { data: userRole } = useQuery({
    queryKey: ['user-role', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrg.id)
        .maybeSingle();

      if (error || !data) return null;
      return (data as any).role as 'owner' | 'admin' | 'member' | null;
    },
    enabled: !!currentOrg,
  });

  return {
    organization: currentOrg,
    userRole,
    isLoading,
    isAdmin: userRole === 'admin' || userRole === 'owner',
    isOwner: userRole === 'owner',
  };
};