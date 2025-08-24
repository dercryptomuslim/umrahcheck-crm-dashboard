'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  IconMail,
  IconSend,
  IconEye,
  IconClick,
  IconCurrencyEuro,
  IconTrendingUp,
  IconCalendar,
  IconUsers,
  IconRocket
} from '@tabler/icons-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock campaign data
const campaigns = [
  {
    id: 1,
    name: '🕌 Ramadan Special - 30% Off',
    status: 'completed',
    sentDate: '2024-03-15',
    recipients: 3521,
    sent: 3521,
    delivered: 3486,
    opened: 1247,
    clicked: 198,
    conversions: 12,
    revenue: 2400,
    subject: 'Ramadan Special: Save €500 on Umrah Packages'
  },
  {
    id: 2,
    name: '⚡ Flash Sale - 48 Hours Only',
    status: 'active',
    sentDate: '2024-03-22',
    recipients: 2156,
    sent: 1850,
    delivered: 1823,
    opened: 612,
    clicked: 89,
    conversions: 5,
    revenue: 1000,
    subject: 'URGENT: Hotel Prices Dropped by €150!'
  },
  {
    id: 3,
    name: '📧 Welcome Back Campaign',
    status: 'scheduled',
    sentDate: '2024-03-25',
    recipients: 5000,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    conversions: 0,
    revenue: 0,
    subject: "We Missed You! Here's €100 Off Your Next Umrah"
  }
];

// Chart data
const performanceData = [
  { name: 'Mon', sent: 450, opened: 180, clicked: 45 },
  { name: 'Tue', sent: 520, opened: 210, clicked: 62 },
  { name: 'Wed', sent: 680, opened: 295, clicked: 89 },
  { name: 'Thu', sent: 750, opened: 320, clicked: 95 },
  { name: 'Fri', sent: 890, opened: 402, clicked: 125 },
  { name: 'Sat', sent: 420, opened: 168, clicked: 38 },
  { name: 'Sun', sent: 380, opened: 142, clicked: 28 }
];

const segmentData = [
  { name: 'Umrah 2025', value: 3521, color: '#10b981' },
  { name: 'Hajj 2025', value: 2156, color: '#3b82f6' },
  { name: 'General', value: 4570, color: '#6b7280' }
];

export default function CampaignsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState(campaigns[0]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'active':
        return 'bg-blue-500';
      case 'scheduled':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const calculateRate = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  };

  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Email Campaigns</h1>
          <p className='text-muted-foreground'>
            Track and manage your email marketing campaigns
          </p>
        </div>
        <Button className='bg-green-600 hover:bg-green-700'>
          <IconRocket className='mr-2 h-4 w-4' />
          Create Campaign
        </Button>
      </div>

      {/* Overview Stats */}
      <div className='grid grid-cols-5 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total Sent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>10,247</div>
            <p className='text-muted-foreground text-xs'>
              <IconTrendingUp className='inline h-3 w-3 text-green-500' /> +12%
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Open Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>35.4%</div>
            <Progress value={35.4} className='mt-2' />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Click Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>12.8%</div>
            <Progress value={12.8} className='mt-2' />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Conversions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>48</div>
            <p className='text-muted-foreground text-xs'>This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>€9,600</div>
            <p className='text-muted-foreground text-xs'>
              <IconTrendingUp className='inline h-3 w-3 text-green-500' /> +28%
              from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className='grid grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>
              Daily email metrics for the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='name' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey='sent' fill='#6b7280' />
                <Bar dataKey='opened' fill='#10b981' />
                <Bar dataKey='clicked' fill='#3b82f6' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audience Segments</CardTitle>
            <CardDescription>
              Contact distribution by travel interest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <PieChart>
                <Pie
                  data={segmentData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill='#8884d8'
                  dataKey='value'
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>
            Your latest email marketing campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className='hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-4'
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className='flex items-center gap-4'>
                  <IconMail className='text-muted-foreground h-8 w-8' />
                  <div>
                    <div className='flex items-center gap-2'>
                      <h3 className='font-semibold'>{campaign.name}</h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className='text-muted-foreground text-sm'>
                      {campaign.subject}
                    </p>
                    <div className='text-muted-foreground mt-1 flex items-center gap-4 text-xs'>
                      <span className='flex items-center gap-1'>
                        <IconCalendar className='h-3 w-3' />
                        {campaign.sentDate}
                      </span>
                      <span className='flex items-center gap-1'>
                        <IconUsers className='h-3 w-3' />
                        {campaign.recipients.toLocaleString()} recipients
                      </span>
                    </div>
                  </div>
                </div>

                <div className='flex gap-6 text-sm'>
                  <div className='text-center'>
                    <div className='font-semibold'>{campaign.delivered}</div>
                    <div className='text-muted-foreground text-xs'>
                      Delivered
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='font-semibold text-green-600'>
                      {campaign.opened}
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      Opened (
                      {calculateRate(campaign.opened, campaign.delivered)}%)
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='font-semibold text-blue-600'>
                      {campaign.clicked}
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      Clicked (
                      {calculateRate(campaign.clicked, campaign.opened)}%)
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='font-semibold text-purple-600'>
                      {campaign.conversions}
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      Conversions
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='font-semibold text-orange-600'>
                      €{campaign.revenue}
                    </div>
                    <div className='text-muted-foreground text-xs'>Revenue</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Details */}
      {selectedCampaign && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details: {selectedCampaign.name}</CardTitle>
            <CardDescription>Performance metrics and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-4 gap-4'>
              <div className='rounded-lg border p-4'>
                <div className='flex items-center justify-between'>
                  <IconSend className='h-8 w-8 text-gray-500' />
                  <span className='text-2xl font-bold'>
                    {selectedCampaign.sent}
                  </span>
                </div>
                <p className='text-muted-foreground mt-2 text-sm'>
                  Emails Sent
                </p>
              </div>
              <div className='rounded-lg border p-4'>
                <div className='flex items-center justify-between'>
                  <IconEye className='h-8 w-8 text-green-500' />
                  <span className='text-2xl font-bold'>
                    {selectedCampaign.opened}
                  </span>
                </div>
                <p className='text-muted-foreground mt-2 text-sm'>
                  Opens (
                  {calculateRate(
                    selectedCampaign.opened,
                    selectedCampaign.delivered
                  )}
                  %)
                </p>
              </div>
              <div className='rounded-lg border p-4'>
                <div className='flex items-center justify-between'>
                  <IconClick className='h-8 w-8 text-blue-500' />
                  <span className='text-2xl font-bold'>
                    {selectedCampaign.clicked}
                  </span>
                </div>
                <p className='text-muted-foreground mt-2 text-sm'>
                  Clicks (
                  {calculateRate(
                    selectedCampaign.clicked,
                    selectedCampaign.opened
                  )}
                  %)
                </p>
              </div>
              <div className='rounded-lg border p-4'>
                <div className='flex items-center justify-between'>
                  <IconCurrencyEuro className='h-8 w-8 text-orange-500' />
                  <span className='text-2xl font-bold'>
                    €{selectedCampaign.revenue}
                  </span>
                </div>
                <p className='text-muted-foreground mt-2 text-sm'>
                  Revenue ({selectedCampaign.conversions} conversions)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
