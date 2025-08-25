'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  Tag,
  Edit,
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';
import type { Contact, ContactEngagement } from '@/types/customer360';

interface ContactSummaryProps {
  contact: Contact;
  engagement?: ContactEngagement;
  onEdit?: () => void;
  onMessage?: () => void;
}

// Lead score color mapping
function getLeadScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 bg-green-50';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

// Lead status color mapping
function getLeadStatusColor(status: string): string {
  switch (status) {
    case 'won':
      return 'bg-green-500';
    case 'qualified':
      return 'bg-blue-500';
    case 'proposal':
      return 'bg-purple-500';
    case 'contacted':
      return 'bg-yellow-500';
    case 'lost':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export function ContactSummary({
  contact,
  engagement,
  onEdit,
  onMessage
}: ContactSummaryProps) {
  const fullName =
    [contact.first_name, contact.last_name].filter(Boolean).join(' ') ||
    'Unbekannt';

  const budgetRange =
    contact.budget_min && contact.budget_max
      ? `€${contact.budget_min.toLocaleString()} - €${contact.budget_max.toLocaleString()}`
      : contact.budget_min
        ? `Ab €${contact.budget_min.toLocaleString()}`
        : contact.budget_max
          ? `Bis €${contact.budget_max.toLocaleString()}`
          : 'Nicht angegeben';

  return (
    <Card>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <CardTitle className='text-2xl'>{fullName}</CardTitle>
            <div className='flex items-center gap-2'>
              <Badge className={getLeadStatusColor(contact.lead_status)}>
                {contact.lead_status.toUpperCase()}
              </Badge>
              {contact.preferred_hotel_tier && (
                <Badge variant='outline'>{contact.preferred_hotel_tier}</Badge>
              )}
            </div>
          </div>

          <div className='flex gap-2'>
            {onMessage && (
              <Button size='sm' variant='outline' onClick={onMessage}>
                <MessageCircle className='mr-1 h-4 w-4' />
                Nachricht
              </Button>
            )}
            {onEdit && (
              <Button size='sm' variant='outline' onClick={onEdit}>
                <Edit className='mr-1 h-4 w-4' />
                Bearbeiten
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Lead Score */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Lead Score</span>
            <span
              className={`font-bold ${getLeadScoreColor(contact.lead_score).split(' ')[0]}`}
            >
              {contact.lead_score}/100
            </span>
          </div>
          <Progress value={contact.lead_score} className='h-2' />
        </div>

        <Separator />

        {/* Contact Information */}
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <Mail className='text-muted-foreground h-4 w-4' />
            <span className='text-sm'>{contact.email}</span>
          </div>

          {contact.phone && (
            <div className='flex items-center gap-3'>
              <Phone className='text-muted-foreground h-4 w-4' />
              <span className='text-sm'>{contact.phone}</span>
            </div>
          )}

          {(contact.city || contact.country) && (
            <div className='flex items-center gap-3'>
              <MapPin className='text-muted-foreground h-4 w-4' />
              <span className='text-sm'>
                {[contact.city, contact.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {contact.language && (
            <div className='flex items-center gap-3'>
              <Globe className='text-muted-foreground h-4 w-4' />
              <span className='text-sm'>{contact.language.toUpperCase()}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Budget & Preferences */}
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <DollarSign className='text-muted-foreground h-4 w-4' />
            <div>
              <p className='text-sm font-medium'>Budget</p>
              <p className='text-muted-foreground text-sm'>{budgetRange}</p>
            </div>
          </div>

          {contact.source && (
            <div className='flex items-center gap-3'>
              <TrendingUp className='text-muted-foreground h-4 w-4' />
              <div>
                <p className='text-sm font-medium'>Quelle</p>
                <p className='text-muted-foreground text-sm'>
                  {contact.source}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Segments & Tags */}
        {(contact.segments.length > 0 || contact.tags.length > 0) && (
          <>
            <Separator />
            <div className='space-y-3'>
              {contact.segments.length > 0 && (
                <div>
                  <p className='mb-2 text-sm font-medium'>Segmente</p>
                  <div className='flex flex-wrap gap-1'>
                    {contact.segments.map((segment) => (
                      <Badge key={segment} variant='secondary'>
                        {segment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {contact.tags.length > 0 && (
                <div>
                  <p className='mb-2 text-sm font-medium'>Tags</p>
                  <div className='flex flex-wrap gap-1'>
                    {contact.tags.map((tag) => (
                      <Badge key={tag} variant='outline'>
                        <Tag className='mr-1 h-3 w-3' />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Engagement Metrics */}
        {engagement && (
          <>
            <Separator />
            <div className='space-y-3'>
              <p className='text-sm font-medium'>Engagement</p>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <p className='text-2xl font-bold'>{engagement.email_opens}</p>
                  <p className='text-muted-foreground text-xs'>
                    Email Öffnungen
                  </p>
                </div>
                <div>
                  <p className='text-2xl font-bold'>
                    {engagement.email_clicks}
                  </p>
                  <p className='text-muted-foreground text-xs'>Klicks</p>
                </div>
                <div>
                  <p className='text-2xl font-bold'>
                    {engagement.bookings_count}
                  </p>
                  <p className='text-muted-foreground text-xs'>Buchungen</p>
                </div>
                <div>
                  <p className='text-2xl font-bold'>
                    {engagement.total_events}
                  </p>
                  <p className='text-muted-foreground text-xs'>Aktivitäten</p>
                </div>
              </div>

              {engagement.last_activity_at && (
                <p className='text-muted-foreground text-xs'>
                  Letzte Aktivität:{' '}
                  {format(
                    new Date(engagement.last_activity_at),
                    'dd.MM.yyyy HH:mm'
                  )}
                </p>
              )}
            </div>
          </>
        )}

        {/* Timestamps */}
        <Separator />
        <div className='text-muted-foreground space-y-1 text-xs'>
          <div className='flex items-center gap-2'>
            <Calendar className='h-3 w-3' />
            <span>
              Erstellt:{' '}
              {format(new Date(contact.created_at), 'dd.MM.yyyy HH:mm')}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Calendar className='h-3 w-3' />
            <span>
              Aktualisiert:{' '}
              {format(new Date(contact.updated_at), 'dd.MM.yyyy HH:mm')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
