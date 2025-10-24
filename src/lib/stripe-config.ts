export const STRIPE_TIERS = {
  starter: {
    name: 'Starter',
    price_id: 'price_1SLlvQFI6AfZKCoZR9WucH5e',
    product_id: 'prod_TIMeETXICef2nT',
    price: 29,
    features: [
      'Up to 50 calls per month',
      'AI-powered transcription',
      'Basic analytics',
      'Framework templates',
      'Email support',
    ],
  },
  professional: {
    name: 'Professional',
    price_id: 'price_1SLly3FI6AfZKCoZHnptaLjf',
    product_id: 'prod_TIMhasHROqzqiw',
    price: 99,
    features: [
      'Unlimited calls',
      'Advanced AI coaching',
      'Custom frameworks',
      'Team collaboration',
      'CRM integrations',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price_id: 'price_1SLlzrFI6AfZKCoZeh0rQ74h',
    product_id: 'prod_TIMjYo5CV9nblo',
    price: 299,
    features: [
      'Everything in Professional',
      'SSO authentication',
      'Custom integrations',
      'Dedicated account manager',
      'Advanced security',
      '99.9% SLA',
    ],
  },
} as const;

export type StripeTier = keyof typeof STRIPE_TIERS;