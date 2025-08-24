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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, Bell, Shield, Mail, Globe, Key } from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    priceAlerts: true,
    campaigns: false,
    billing: true
  });

  const [preferences, setPreferences] = useState({
    language: 'de',
    timezone: 'Europe/Berlin',
    currency: 'EUR',
    theme: 'system'
  });

  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* Header */}
      <div>
        <h1 className='flex items-center gap-2 text-3xl font-bold'>
          <Settings className='h-8 w-8' />
          Settings
        </h1>
        <p className='text-muted-foreground'>
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue='profile' className='w-full'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='profile'>👤 Profile</TabsTrigger>
          <TabsTrigger value='notifications'>🔔 Notifications</TabsTrigger>
          <TabsTrigger value='preferences'>🌐 Preferences</TabsTrigger>
          <TabsTrigger value='security'>🔒 Security</TabsTrigger>
          <TabsTrigger value='integrations'>🔗 Integrations</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value='profile' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and company details
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='firstName'>First Name</Label>
                  <Input
                    id='firstName'
                    placeholder='Mustafa'
                    defaultValue='Mustafa'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='lastName'>Last Name</Label>
                  <Input id='lastName' placeholder='Ali' defaultValue='Ali' />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>Email Address</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='mustafa19musse@hotmail.de'
                  defaultValue='mustafa19musse@hotmail.de'
                  disabled
                />
                <p className='text-muted-foreground text-xs'>
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='company'>Company/Agency Name</Label>
                <Input
                  id='company'
                  placeholder='UmrahCheck GmbH'
                  defaultValue='UmrahCheck'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='website'>Website</Label>
                <Input
                  id='website'
                  placeholder='https://umrahcheck.de'
                  defaultValue='https://umrahcheck.de'
                />
              </div>

              <Button>Save Profile Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value='notifications' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Bell className='h-5 w-5' />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about important events
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <Label>Email Notifications</Label>
                  <p className='text-muted-foreground text-sm'>
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <Label>Browser Notifications</Label>
                  <p className='text-muted-foreground text-sm'>
                    Show desktop notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={notifications.browser}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, browser: checked })
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <Label>Hotel Price Alerts</Label>
                  <p className='text-muted-foreground text-sm'>
                    Get notified when hotel prices drop
                  </p>
                </div>
                <Switch
                  checked={notifications.priceAlerts}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, priceAlerts: checked })
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <Label>Campaign Updates</Label>
                  <p className='text-muted-foreground text-sm'>
                    Updates about your email campaigns
                  </p>
                </div>
                <Switch
                  checked={notifications.campaigns}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, campaigns: checked })
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <Label>Billing Notifications</Label>
                  <p className='text-muted-foreground text-sm'>
                    Payment confirmations and billing updates
                  </p>
                </div>
                <Switch
                  checked={notifications.billing}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, billing: checked })
                  }
                />
              </div>

              <Button>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value='preferences' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Globe className='h-5 w-5' />
                Regional Preferences
              </CardTitle>
              <CardDescription>
                Set your language, timezone, and currency preferences
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) =>
                      setPreferences({ ...preferences, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='de'>🇩🇪 Deutsch</SelectItem>
                      <SelectItem value='en'>🇺🇸 English</SelectItem>
                      <SelectItem value='ar'>🇸🇦 العربية</SelectItem>
                      <SelectItem value='tr'>🇹🇷 Türkçe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>Timezone</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) =>
                      setPreferences({ ...preferences, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Europe/Berlin'>
                        Europe/Berlin (CET)
                      </SelectItem>
                      <SelectItem value='Europe/London'>
                        Europe/London (GMT)
                      </SelectItem>
                      <SelectItem value='America/New_York'>
                        America/New_York (EST)
                      </SelectItem>
                      <SelectItem value='Asia/Dubai'>
                        Asia/Dubai (GST)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Currency</Label>
                  <Select
                    value={preferences.currency}
                    onValueChange={(value) =>
                      setPreferences({ ...preferences, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='EUR'>EUR (€)</SelectItem>
                      <SelectItem value='USD'>USD ($)</SelectItem>
                      <SelectItem value='GBP'>GBP (£)</SelectItem>
                      <SelectItem value='AED'>AED (د.إ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>Theme</Label>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value) =>
                      setPreferences({ ...preferences, theme: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='system'>🖥️ System</SelectItem>
                      <SelectItem value='light'>☀️ Light</SelectItem>
                      <SelectItem value='dark'>🌙 Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value='security' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='h-5 w-5' />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <Label>Two-Factor Authentication (2FA)</Label>
                    <p className='text-muted-foreground text-sm'>
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant='outline'>Enable 2FA</Button>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <Label>API Keys</Label>
                    <p className='text-muted-foreground text-sm'>
                      Manage API keys for integrations
                    </p>
                  </div>
                  <Button variant='outline'>Manage Keys</Button>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <Label>Active Sessions</Label>
                    <p className='text-muted-foreground text-sm'>
                      View and manage your active login sessions
                    </p>
                  </div>
                  <Button variant='outline'>View Sessions</Button>
                </div>
              </div>

              <div className='border-t pt-6'>
                <h3 className='mb-2 font-medium text-red-600'>Danger Zone</h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <Label>Delete Account</Label>
                      <p className='text-muted-foreground text-sm'>
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant='destructive'>Delete Account</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value='integrations' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Key className='h-5 w-5' />
                API Integrations
              </CardTitle>
              <CardDescription>
                Connect UmrahCheck with your favorite tools
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid gap-4'>
                <div className='flex items-center justify-between rounded-lg border p-4'>
                  <div className='flex items-center gap-4'>
                    <Mail className='h-8 w-8 text-blue-500' />
                    <div>
                      <h3 className='font-medium'>Resend Email Service</h3>
                      <p className='text-muted-foreground text-sm'>
                        Connected • Sending emails via Resend API
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm'>
                      Configure
                    </Button>
                    <Button variant='outline' size='sm'>
                      Disconnect
                    </Button>
                  </div>
                </div>

                <div className='flex items-center justify-between rounded-lg border p-4'>
                  <div className='flex items-center gap-4'>
                    <div className='flex h-8 w-8 items-center justify-center rounded bg-purple-100'>
                      🏨
                    </div>
                    <div>
                      <h3 className='font-medium'>ScrapFly (Hotel Data)</h3>
                      <p className='text-muted-foreground text-sm'>
                        Connected • 38,521 / 40,000 credits used
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm'>
                      Configure
                    </Button>
                    <Button variant='outline' size='sm'>
                      Disconnect
                    </Button>
                  </div>
                </div>

                <div className='flex items-center justify-between rounded-lg border p-4 opacity-50'>
                  <div className='flex items-center gap-4'>
                    <div className='flex h-8 w-8 items-center justify-center rounded bg-green-100'>
                      🕌
                    </div>
                    <div>
                      <h3 className='font-medium'>HalalBooking Affiliate</h3>
                      <p className='text-muted-foreground text-sm'>
                        Ready to connect • 5% commission rate
                      </p>
                    </div>
                  </div>
                  <Button variant='outline' size='sm'>
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
