'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Timeline } from '@/components/customer360/Timeline';
import { ContactSummary } from '@/components/customer360/ContactSummary';
import {
  ArrowLeft,
  Activity,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import type { Contact360Response } from '@/types/customer360';

export default function Contact360Page() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [data, setData] = useState<Contact360Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContact360Data();
  }, [contactId]);

  const fetchContact360Data = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/contacts/${contactId}/360`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Kontakt nicht gefunden');
        }
        throw new Error('Fehler beim Laden der Kontaktdaten');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit modal or navigate to edit page
    console.log('Edit contact:', contactId);
  };

  const handleMessage = () => {
    // TODO: Implement message modal or navigate to message page
    console.log('Message contact:', contactId);
  };

  if (loading) {
    return (
      <div className='container mx-auto space-y-6 p-6'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-10 w-10' />
          <Skeleton className='h-8 w-64' />
        </div>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <Skeleton className='h-[600px]' />
          <div className='lg:col-span-2'>
            <Skeleton className='h-[600px]' />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto p-6'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant='outline'
          onClick={() => router.back()}
          className='mt-4'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Zurück
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { contact, timeline, bookings, engagement } = data;

  // Calculate total revenue
  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + booking.amount,
    0
  );
  const totalCommission = bookings.reduce(
    (sum, booking) => sum + booking.commission,
    0
  );

  return (
    <div className='container mx-auto space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='sm' onClick={() => router.back()}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Zurück
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>Customer 360°</h1>
          <p className='text-muted-foreground'>
            Vollständige Übersicht über Kontakt und Aktivitäten
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Left Column - Contact Summary */}
        <div>
          <ContactSummary
            contact={contact}
            engagement={engagement}
            onEdit={handleEdit}
            onMessage={handleMessage}
          />
        </div>

        {/* Right Column - Timeline & Bookings */}
        <div className='lg:col-span-2'>
          <Tabs defaultValue='timeline' className='space-y-4'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='timeline' className='flex items-center gap-2'>
                <Activity className='h-4 w-4' />
                Timeline
              </TabsTrigger>
              <TabsTrigger value='bookings' className='flex items-center gap-2'>
                <Calendar className='h-4 w-4' />
                Buchungen ({bookings.length})
              </TabsTrigger>
              <TabsTrigger
                value='analytics'
                className='flex items-center gap-2'
              >
                <DollarSign className='h-4 w-4' />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value='timeline' className='space-y-4'>
              <Timeline events={timeline} />
            </TabsContent>

            <TabsContent value='bookings' className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Buchungen</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className='text-muted-foreground py-8 text-center'>
                      <Calendar className='mx-auto mb-4 h-12 w-12 opacity-50' />
                      <p>Keine Buchungen vorhanden</p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className='flex items-center justify-between rounded-lg border p-4'
                        >
                          <div>
                            <p className='font-medium'>
                              {booking.kind.charAt(0).toUpperCase() +
                                booking.kind.slice(1)}
                            </p>
                            <p className='text-muted-foreground text-sm'>
                              {booking.provider} • {booking.status}
                            </p>
                            {booking.check_in && booking.check_out && (
                              <p className='text-muted-foreground text-sm'>
                                {new Date(
                                  booking.check_in
                                ).toLocaleDateString()}{' '}
                                -{' '}
                                {new Date(
                                  booking.check_out
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className='text-right'>
                            <p className='font-bold'>
                              €{booking.amount.toLocaleString()}
                            </p>
                            {booking.commission > 0 && (
                              <p className='text-sm text-green-600'>
                                +€{booking.commission.toLocaleString()}{' '}
                                Provision
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='analytics' className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Gesamtumsatz
                    </CardTitle>
                    <DollarSign className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      €{totalRevenue.toLocaleString()}
                    </div>
                    <p className='text-muted-foreground text-xs'>
                      Aus {bookings.length} Buchungen
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Provisionen
                    </CardTitle>
                    <DollarSign className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold text-green-600'>
                      €{totalCommission.toLocaleString()}
                    </div>
                    <p className='text-muted-foreground text-xs'>
                      Verdiente Provisionen
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Engagement Score
                    </CardTitle>
                    <Activity className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {engagement?.total_events || 0}
                    </div>
                    <p className='text-muted-foreground text-xs'>
                      Gesamte Aktivitäten
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Konversionsrate
                    </CardTitle>
                    <Activity className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {engagement && engagement.email_opens > 0
                        ? Math.round(
                            (engagement.email_clicks / engagement.email_opens) *
                              100
                          )
                        : 0}
                      %
                    </div>
                    <p className='text-muted-foreground text-xs'>
                      Click-to-Open Rate
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
