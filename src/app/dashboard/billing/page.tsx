'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard,
  Calendar,
  Users,
  Mail,
  Hotel,
  Crown,
  Check,
  ArrowRight
} from 'lucide-react';

// Mock subscription data
const currentPlan = {
  name: 'Professional',
  price: 49,
  period: 'monthly',
  status: 'active',
  nextBilling: '2025-09-24',
  features: {
    contacts: { used: 2847, limit: 10000 },
    emails: { used: 1523, limit: 5000 },
    hotels: { used: 47, limit: 100 },
    campaigns: { used: 12, limit: 50 }
  }
};

const plans = [
  {
    name: 'Starter',
    price: 19,
    period: 'month',
    description: 'Perfect for small agencies getting started',
    features: [
      '2,500 contacts',
      '1,000 emails/month',
      '25 hotel searches',
      '10 campaigns',
      'Basic support'
    ],
    popular: false
  },
  {
    name: 'Professional',
    price: 49,
    period: 'month',
    description: 'Ideal for growing Umrah agencies',
    features: [
      '10,000 contacts',
      '5,000 emails/month',
      '100 hotel searches',
      '50 campaigns',
      'Priority support',
      'Advanced analytics',
      'Team collaboration'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 149,
    period: 'month',
    description: 'For large agencies with high volume',
    features: [
      'Unlimited contacts',
      '25,000 emails/month',
      'Unlimited hotel searches',
      'Unlimited campaigns',
      '24/7 dedicated support',
      'Custom integrations',
      'White-label options',
      'API access'
    ],
    popular: false
  }
];

export default function BillingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>💳 Billing & Subscription</h1>
        <p className='text-muted-foreground'>
          Manage your UmrahCheck CRM subscription and usage
        </p>
      </div>

      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Crown className='h-5 w-5 text-yellow-500' />
                Current Plan: {currentPlan.name}
              </CardTitle>
              <CardDescription>
                €{currentPlan.price}/{currentPlan.period} • Next billing:{' '}
                {currentPlan.nextBilling}
              </CardDescription>
            </div>
            <Badge variant='outline' className='bg-green-50 text-green-700'>
              ✅ Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Usage Statistics */}
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Users className='h-4 w-4 text-blue-500' />
                <span className='text-sm font-medium'>Contacts</span>
              </div>
              <Progress
                value={getUsagePercentage(
                  currentPlan.features.contacts.used,
                  currentPlan.features.contacts.limit
                )}
                className='h-2'
              />
              <p className='text-muted-foreground text-xs'>
                {currentPlan.features.contacts.used.toLocaleString()} /{' '}
                {currentPlan.features.contacts.limit.toLocaleString()}
              </p>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Mail className='h-4 w-4 text-green-500' />
                <span className='text-sm font-medium'>Emails</span>
              </div>
              <Progress
                value={getUsagePercentage(
                  currentPlan.features.emails.used,
                  currentPlan.features.emails.limit
                )}
                className='h-2'
              />
              <p className='text-muted-foreground text-xs'>
                {currentPlan.features.emails.used.toLocaleString()} /{' '}
                {currentPlan.features.emails.limit.toLocaleString()}
              </p>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Hotel className='h-4 w-4 text-purple-500' />
                <span className='text-sm font-medium'>Hotel Searches</span>
              </div>
              <Progress
                value={getUsagePercentage(
                  currentPlan.features.hotels.used,
                  currentPlan.features.hotels.limit
                )}
                className='h-2'
              />
              <p className='text-muted-foreground text-xs'>
                {currentPlan.features.hotels.used} /{' '}
                {currentPlan.features.hotels.limit}
              </p>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4 text-orange-500' />
                <span className='text-sm font-medium'>Campaigns</span>
              </div>
              <Progress
                value={getUsagePercentage(
                  currentPlan.features.campaigns.used,
                  currentPlan.features.campaigns.limit
                )}
                className='h-2'
              />
              <p className='text-muted-foreground text-xs'>
                {currentPlan.features.campaigns.used} /{' '}
                {currentPlan.features.campaigns.limit}
              </p>
            </div>
          </div>

          <div className='flex gap-4'>
            <Button variant='outline'>
              <CreditCard className='mr-2 h-4 w-4' />
              Update Payment Method
            </Button>
            <Button variant='outline'>📄 Download Invoice</Button>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Available Plans</CardTitle>
          <CardDescription>
            Choose the perfect plan for your agency's needs
          </CardDescription>

          {/* Annual/Monthly Toggle */}
          <div className='flex items-center gap-4'>
            <span
              className={`text-sm ${!isAnnual ? 'font-medium' : 'text-muted-foreground'}`}
            >
              Monthly
            </span>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative ${isAnnual ? 'bg-blue-100' : ''}`}
            >
              {isAnnual ? 'Annual (20% off)' : 'Monthly'}
            </Button>
            <span
              className={`text-sm ${isAnnual ? 'font-medium' : 'text-muted-foreground'}`}
            >
              Annual
            </span>
            {isAnnual && (
              <Badge className='bg-green-100 text-green-700'>Save 20%</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid gap-6 md:grid-cols-3'>
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
              >
                {plan.popular && (
                  <div className='absolute -top-3 left-1/2 -translate-x-1/2 transform'>
                    <Badge className='bg-blue-500 text-white'>
                      🔥 Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className='flex items-center justify-between'>
                    <span>{plan.name}</span>
                    {plan.name === currentPlan.name && (
                      <Badge variant='outline'>Current</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>

                  <div className='mt-4'>
                    <span className='text-3xl font-bold'>
                      €{isAnnual ? Math.round(plan.price * 0.8) : plan.price}
                    </span>
                    <span className='text-muted-foreground'>
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className='mb-6 space-y-2'>
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className='flex items-center gap-2'
                      >
                        <Check className='h-4 w-4 text-green-500' />
                        <span className='text-sm'>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={
                      plan.name === currentPlan.name ? 'outline' : 'default'
                    }
                    disabled={plan.name === currentPlan.name}
                  >
                    {plan.name === currentPlan.name ? (
                      'Current Plan'
                    ) : (
                      <>
                        {plan.price > 49 ? 'Upgrade' : 'Downgrade'} to{' '}
                        {plan.name}
                        <ArrowRight className='ml-2 h-4 w-4' />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>🧾 Billing History</CardTitle>
          <CardDescription>Your recent payments and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[
              {
                date: '2025-08-24',
                amount: '€49.00',
                status: 'paid',
                invoice: 'INV-001'
              },
              {
                date: '2025-07-24',
                amount: '€49.00',
                status: 'paid',
                invoice: 'INV-002'
              },
              {
                date: '2025-06-24',
                amount: '€49.00',
                status: 'paid',
                invoice: 'INV-003'
              }
            ].map((payment, index) => (
              <div
                key={index}
                className='flex items-center justify-between rounded-lg border p-4'
              >
                <div className='flex items-center gap-4'>
                  <CreditCard className='text-muted-foreground h-5 w-5' />
                  <div>
                    <p className='font-medium'>{payment.amount}</p>
                    <p className='text-muted-foreground text-sm'>
                      {payment.date}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-4'>
                  <Badge className='bg-green-100 text-green-700'>
                    ✅ {payment.status}
                  </Badge>
                  <Button variant='ghost' size='sm'>
                    Download PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
