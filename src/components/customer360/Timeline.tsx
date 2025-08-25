'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  MessageCircle,
  Globe,
  Calendar,
  DollarSign,
  MousePointer,
  Eye,
  FileText,
  Send,
  CheckCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Event } from '@/types/customer360';

interface TimelineProps {
  events: Event[];
  className?: string;
}

// Icon mapping for event types
const eventIcons: Record<string, React.ElementType> = {
  opened: Eye,
  clicked: MousePointer,
  replied: Send,
  booked: Calendar,
  paid: DollarSign,
  visited: Globe,
  form_submitted: FileText,
  campaign_sent: Mail,
  lead_created: CheckCircle,
  lead_updated: FileText
};

// Source colors
const sourceColors: Record<string, string> = {
  email: 'bg-blue-500',
  whatsapp: 'bg-green-500',
  telegram: 'bg-sky-500',
  web: 'bg-purple-500',
  api: 'bg-gray-500',
  hotel: 'bg-orange-500',
  flight: 'bg-indigo-500'
};

// Event type labels in German
const eventTypeLabels: Record<string, string> = {
  opened: 'Geöffnet',
  clicked: 'Geklickt',
  replied: 'Geantwortet',
  booked: 'Gebucht',
  paid: 'Bezahlt',
  visited: 'Besucht',
  form_submitted: 'Formular gesendet',
  campaign_sent: 'Kampagne gesendet',
  lead_created: 'Lead erstellt',
  lead_updated: 'Lead aktualisiert'
};

export function Timeline({ events, className = '' }: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <Card className={className}>
        <CardContent className='text-muted-foreground py-8 text-center'>
          <Globe className='mx-auto mb-4 h-12 w-12 opacity-50' />
          <p>Keine Aktivitäten vorhanden</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <ScrollArea className='h-[600px]'>
        <div className='p-6'>
          <div className='space-y-8'>
            {events.map((event, index) => {
              const Icon = eventIcons[event.type] || Globe;
              const isLast = index === events.length - 1;

              return (
                <div key={event.id} className='relative flex gap-4'>
                  {/* Timeline line */}
                  {!isLast && (
                    <div className='bg-border absolute top-10 left-5 h-full w-px' />
                  )}

                  {/* Icon */}
                  <div className='bg-background relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border'>
                    <Icon className='h-4 w-4' />
                    <div
                      className={`absolute -right-1 -bottom-1 h-3 w-3 rounded-full ${
                        sourceColors[event.source] || 'bg-gray-500'
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm leading-none font-medium'>
                        {eventTypeLabels[event.type] || event.type}
                      </p>
                      <Badge variant='outline' className='text-xs'>
                        {event.source}
                      </Badge>
                    </div>

                    <p className='text-muted-foreground text-sm'>
                      {formatDistanceToNow(new Date(event.occurred_at), {
                        addSuffix: true,
                        locale: de
                      })}
                    </p>

                    {/* Payload details */}
                    {event.payload && Object.keys(event.payload).length > 0 && (
                      <div className='bg-muted/50 mt-2 rounded-lg p-2'>
                        <pre className='text-muted-foreground text-xs'>
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Actor info */}
                    {event.actor !== 'system' && (
                      <p className='text-muted-foreground text-xs'>
                        Von: {event.actor}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className='text-muted-foreground text-xs'>
                    {format(new Date(event.occurred_at), 'dd.MM.yyyy HH:mm')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
