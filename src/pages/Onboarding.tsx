import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Building2, User, ArrowRight, Loader2, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { STRIPE_TIERS } from '@/lib/stripe-config';

const orgSchema = z.object({
  name: z.string().trim().min(2, { message: 'Organization name must be at least 2 characters' }).max(100),
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' }),
});

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'type' | 'b2b-setup' | 'plan-selection' | 'complete'>('type');
  const [accountType, setAccountType] = useState<'b2b' | 'b2c' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single();

      if (profile?.onboarding_completed) {
        navigate('/dashboard');
      }
    };

    checkAuth();
  }, [navigate]);

  const handleTypeSelection = async (type: 'b2b' | 'b2c') => {
    setAccountType(type);

    if (type === 'b2c') {
      // For B2C, complete onboarding and go to plan selection
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase
          .from('profiles')
          .update({
            account_type: 'b2c',
            onboarding_completed: true,
          })
          .eq('id', session.user.id);

        toast({
          title: 'Account created!',
          description: 'Choose a plan to get started.',
        });

        setStep('plan-selection');
      } catch (error: any) {
        toast({
          title: 'Setup failed',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setStep('b2b-setup');
    }
  };

  const handleB2BSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = orgSchema.parse({ name: orgName, slug: orgSlug });
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: validated.name,
          slug: validated.slug,
          owner_id: session.user.id,
        })
        .select()
        .single();

      if (orgError) {
        if (orgError.code === '23505') {
          toast({
            title: 'Organization slug already taken',
            description: 'Please choose a different slug.',
            variant: 'destructive',
          });
        } else {
          throw orgError;
        }
        return;
      }

      // Add user as owner in organization_members
      await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: session.user.id,
          role: 'owner',
        });

      // Update profile
      await supabase
        .from('profiles')
        .update({
          account_type: 'b2b',
          onboarding_completed: true,
        })
        .eq('id', session.user.id);

      toast({
        title: 'Organization created!',
        description: `Welcome to ${validated.name}`,
      });

      // Move to plan selection
      setStep('plan-selection');
    } catch (error: any) {
      if (error.errors) {
        toast({
          title: 'Validation error',
          description: error.errors[0]?.message || 'Please check your input',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Setup failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handlePlanSelection = async (tier: string) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const tierConfig = STRIPE_TIERS[tier as keyof typeof STRIPE_TIERS];
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: tierConfig.price_id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        toast({
          title: 'Redirecting to checkout',
          description: 'Complete your payment to activate your subscription',
        });
        // Still navigate to dashboard
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (error: any) {
      toast({
        title: 'Checkout failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipPlan = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {step === 'type' && (
          <Card className="card-elevated bg-white p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">Welcome to Echo!</h1>
              <p className="text-subtext text-lg">How will you be using Echo?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeSelection('b2b')}
                disabled={isLoading}
                className="p-6 border-2 border-border rounded-xl hover:border-accent transition-all text-left group"
              >
                <Building2 className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-xl font-bold text-primary mb-2">For My Team</h3>
                <p className="text-subtext mb-4">
                  Set up an organization workspace with team collaboration, SSO, and advanced analytics.
                </p>
                <div className="flex items-center text-accent font-medium group-hover:gap-2 transition-all">
                  Get Started <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeSelection('b2c')}
                disabled={isLoading}
                className="p-6 border-2 border-border rounded-xl hover:border-accent transition-all text-left group"
              >
                <User className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-xl font-bold text-primary mb-2">Just For Me</h3>
                <p className="text-subtext mb-4">
                  Create a personal workspace to track your sales calls and improve your performance.
                </p>
                <div className="flex items-center text-accent font-medium group-hover:gap-2 transition-all">
                  Get Started <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </motion.button>
            </div>
          </Card>
        )}

        {step === 'b2b-setup' && (
          <Card className="card-elevated bg-white p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">Set up your organization</h1>
              <p className="text-subtext text-lg">Create your team workspace</p>
            </div>

            <form onSubmit={handleB2BSetup} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  type="text"
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    if (!orgSlug) {
                      setOrgSlug(generateSlug(e.target.value));
                    }
                  }}
                  required
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-slug">Organization Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-subtext">echo.ai/</span>
                  <Input
                    id="org-slug"
                    type="text"
                    placeholder="acme-corp"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    required
                    className="bg-white"
                  />
                </div>
                <p className="text-xs text-subtext">This will be your organization's unique URL</p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('type')}
                  disabled={isLoading}
                  className="border-border"
                >
                  Back
                </Button>
                <Button type="submit" className="btn-accent flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Organization'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {step === 'plan-selection' && (
          <Card className="card-elevated bg-white p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">Choose your plan</h1>
              <p className="text-subtext text-lg">Select the plan that fits your needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {Object.entries(STRIPE_TIERS).map(([key, tier]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  className={`p-6 border-2 rounded-xl transition-all cursor-pointer ${
                    selectedTier === key ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
                  }`}
                  onClick={() => setSelectedTier(key)}
                >
                  <h3 className="text-xl font-bold text-primary mb-2">{tier.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-accent">${tier.price}</span>
                    <span className="text-subtext">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-subtext">
                        <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkipPlan}
                className="border-border"
              >
                Skip for now
              </Button>
              <Button
                onClick={() => selectedTier && handlePlanSelection(selectedTier)}
                disabled={!selectedTier || isLoading}
                className="btn-accent flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default Onboarding;