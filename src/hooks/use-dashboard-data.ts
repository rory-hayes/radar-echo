import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        avgCoverage: 0,
        avgTalkRatio: 50,
        avgDuration: 30,
        recentMeetings: (meetings?.filter(m => m.status === 'completed') || []).slice(0, 3).map(m => ({
          id: m.id,
          title: m.title,
          rep: user.email?.split('@')[0] || 'User',
          date: m.created_at,
          coverage: 0,
        })),
        upcomingMeetings: meetings?.filter(m => m.status === 'scheduled').slice(0, 5) || [],
        sentiment: 'positive' as const,
      };
    },
  });
};
