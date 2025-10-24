import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STRIPE_TIERS } from '@/lib/stripe-config';

export type SubscriptionStatus = {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
  tier: string | null;
  loading: boolean;
};

export const useSubscription = () => {
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    product_id: null,
    subscription_end: null,
    tier: null,
    loading: true,
  });

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus({ subscribed: false, product_id: null, subscription_end: null, tier: null, loading: false });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Find tier based on product_id
      let tier = null;
      if (data.product_id) {
        tier = Object.entries(STRIPE_TIERS).find(
          ([_, config]) => config.product_id === data.product_id
        )?.[0] || null;
      }

      setStatus({
        subscribed: data.subscribed || false,
        product_id: data.product_id,
        subscription_end: data.subscription_end,
        tier,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setStatus({ subscribed: false, product_id: null, subscription_end: null, tier: null, loading: false });
    }
  };

  useEffect(() => {
    checkSubscription();

    // Check every minute
    const interval = setInterval(checkSubscription, 60000);

    return () => clearInterval(interval);
  }, []);

  return { status, refreshSubscription: checkSubscription };
};