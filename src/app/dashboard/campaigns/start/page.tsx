'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Mail,
  Send,
  Users,
  Eye,
  ArrowLeft,
  Calendar,
  Clock,
  Target
} from 'lucide-react';

const campaignTemplates = [
  {
    id: 'welcome_back',
    name: '🕌 Willkommen zurück',
    description: 'Begrüßen Sie zurückkehrende Kunden mit exklusiven Angeboten',
    subject: 'Willkommen zurück! Exklusive Umrah-Hotel-Angebote nur für Sie',
    estimatedOpen: '68%',
    category: 'retention'
  },
  {
    id: 'price_drop',
    name: '💰 Preisalarm',
    description: 'Informieren Sie über aktuelle Hotelprice-Drops',
    subject: 'Preisalarm! Ihre Lieblings-Hotels sind jetzt günstiger',
    estimatedOpen: '72%',
    category: 'promotional'
  },
  {
    id: 'ramadan_special',
    name: '🌙 Ramadan Special',
    description: 'Spezielle Ramadan & Umrah Angebote',
    subject: 'Ramadan Mubarak! Exklusive Umrah-Angebote für den heiligen Monat',
    estimatedOpen: '76%',
    category: 'seasonal'
  }
];

const audienceSegments = [
  {
    id: 'all_contacts',
    name: 'Alle Kontakte',
    count: 2847,
    description: 'Alle verfügbaren Email-Kontakte'
  },
  {
    id: 'umrah_2025',
    name: 'Umrah 2025 Interessenten',
    count: 1524,
    description: 'Kunden die Interesse an Umrah 2025 gezeigt haben'
  },
  {
    id: 'premium_customers',
    name: 'Premium Kunden',
    count: 456,
    description: 'Kunden mit Budget >€2000'
  },
  {
    id: 'recent_inquiries',
    name: 'Aktuelle Anfragen',
    count: 231,
    description: 'Kontakte aus den letzten 30 Tagen'
  }
];

export default function StartCampaignPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedAudience, setSelectedAudience] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [scheduleType, setScheduleType] = useState('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);

  const selectedTemplateData = campaignTemplates.find(
    (t) => t.id === selectedTemplate
  );
  const selectedAudienceData = audienceSegments.find(
    (a) => a.id === selectedAudience
  );

  const handleLaunchCampaign = async () => {
    if (!selectedTemplate || !selectedAudience || !campaignName) {
      alert('Bitte füllen Sie alle erforderlichen Felder aus.');
      return;
    }

    setIsLaunching(true);
    setLaunchProgress(0);

    try {
      // Progress Simulation
      const progressInterval = setInterval(() => {
        setLaunchProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 300);

      const response = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaign_type: selectedTemplate,
          recipients: selectedAudienceData?.count || 0,
          segment: selectedAudience,
          language: 'de'
        })
      });

      clearInterval(progressInterval);
      setLaunchProgress(100);

      if (!response.ok) {
        throw new Error('Campaign launch failed');
      }

      const result = await response.json();

      // Success - redirect to campaigns overview
      setTimeout(() => {
        router.push('/dashboard/campaigns');
      }, 1000);
    } catch (error) {
      console.error('Campaign launch error:', error);
      alert(
        'Kampagne konnte nicht gestartet werden. Bitte versuchen Sie es erneut.'
      );
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='sm' onClick={() => router.back()}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Zurück
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>📧 Email-Kampagne starten</h1>
          <p className='text-muted-foreground'>
            Erstellen und starten Sie eine neue Email-Marketing-Kampagne
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Main Configuration */}
        <div className='space-y-6 lg:col-span-2'>
          {/* Campaign Name */}
          <Card>
            <CardHeader>
              <CardTitle>📝 Kampagnen-Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='campaign-name'>Kampagnen-Name *</Label>
                <Input
                  id='campaign-name'
                  placeholder='z.B. Ramadan Umrah Angebote 2025'
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>🎨 Email-Template auswählen *</CardTitle>
              <CardDescription>
                Wählen Sie eine vorgefertigte Email-Vorlage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4'>
                {campaignTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h3 className='font-medium'>{template.name}</h3>
                        <p className='text-muted-foreground mb-2 text-sm'>
                          {template.description}
                        </p>
                        <p className='mb-2 text-xs text-gray-600'>
                          Betreff: "{template.subject}"
                        </p>
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline'>
                            <Eye className='mr-1 h-3 w-3' />~
                            {template.estimatedOpen} Öffnungsrate
                          </Badge>
                          <Badge variant='secondary'>{template.category}</Badge>
                        </div>
                      </div>
                      {selectedTemplate === template.id && (
                        <div className='ml-4'>
                          <div className='flex h-5 w-5 items-center justify-center rounded-full bg-blue-500'>
                            <div className='h-2 w-2 rounded-full bg-white' />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Audience Selection */}
          <Card>
            <CardHeader>
              <CardTitle>👥 Zielgruppe auswählen *</CardTitle>
              <CardDescription>
                Wählen Sie die Empfänger für Ihre Kampagne
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4'>
                {audienceSegments.map((segment) => (
                  <div
                    key={segment.id}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      selectedAudience === segment.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAudience(segment.id)}
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='font-medium'>{segment.name}</h3>
                        <p className='text-muted-foreground text-sm'>
                          {segment.description}
                        </p>
                      </div>
                      <div className='text-right'>
                        <div className='text-lg font-bold text-blue-600'>
                          {segment.count.toLocaleString()}
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          Empfänger
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle>⏰ Zeitplanung</CardTitle>
              <CardDescription>
                Wann soll die Kampagne gesendet werden?
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-4'>
                <div
                  className={`cursor-pointer rounded-lg border p-3 ${
                    scheduleType === 'now' ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setScheduleType('now')}
                >
                  <div className='flex items-center gap-3'>
                    <Send className='h-4 w-4' />
                    <div>
                      <div className='font-medium'>Sofort senden</div>
                      <div className='text-muted-foreground text-sm'>
                        Kampagne wird sofort nach dem Start versendet
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`cursor-pointer rounded-lg border p-3 ${
                    scheduleType === 'later' ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setScheduleType('later')}
                >
                  <div className='flex items-center gap-3'>
                    <Calendar className='h-4 w-4' />
                    <div>
                      <div className='font-medium'>Später senden</div>
                      <div className='text-muted-foreground text-sm'>
                        Kampagne zu einem bestimmten Zeitpunkt senden
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {scheduleType === 'later' && (
                <div className='mt-4'>
                  <Label htmlFor='scheduled-date'>Zeitpunkt auswählen</Label>
                  <Input
                    id='scheduled-date'
                    type='datetime-local'
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className='mt-1'
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview & Launch */}
        <div className='space-y-6'>
          {/* Campaign Preview */}
          <Card>
            <CardHeader>
              <CardTitle>👁️ Kampagnen-Vorschau</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {selectedTemplateData && selectedAudienceData && campaignName ? (
                <>
                  <div className='space-y-2'>
                    <div className='text-muted-foreground text-sm'>
                      Kampagne:
                    </div>
                    <div className='font-medium'>{campaignName}</div>
                  </div>

                  <div className='space-y-2'>
                    <div className='text-muted-foreground text-sm'>
                      Template:
                    </div>
                    <div className='font-medium'>
                      {selectedTemplateData.name}
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='text-muted-foreground text-sm'>
                      Empfänger:
                    </div>
                    <div className='font-medium'>
                      {selectedAudienceData.count.toLocaleString()} Kontakte
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='text-muted-foreground text-sm'>
                      Geschätzte Kosten:
                    </div>
                    <div className='font-medium text-green-600'>
                      €{(selectedAudienceData.count * 0.001).toFixed(2)}
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      €0.001 pro Email
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='text-muted-foreground text-sm'>
                      Erwartete Öffnungsrate:
                    </div>
                    <div className='font-medium text-blue-600'>
                      ~{selectedTemplateData.estimatedOpen}
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      ≈
                      {Math.round(
                        (selectedAudienceData.count *
                          parseFloat(selectedTemplateData.estimatedOpen)) /
                          100
                      )}{' '}
                      Öffnungen erwartet
                    </div>
                  </div>
                </>
              ) : (
                <div className='text-muted-foreground py-8 text-center'>
                  <Mail className='mx-auto mb-4 h-12 w-12 opacity-50' />
                  <p>Wählen Sie Template und Zielgruppe aus</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Launch Button */}
          <Card>
            <CardContent className='pt-6'>
              {isLaunching ? (
                <div className='space-y-4'>
                  <div className='text-center'>
                    <div className='text-lg font-medium'>
                      📤 Kampagne wird gestartet...
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      {Math.round(launchProgress)}% abgeschlossen
                    </div>
                  </div>
                  <Progress value={launchProgress} className='w-full' />
                </div>
              ) : (
                <Button
                  className='w-full'
                  size='lg'
                  onClick={handleLaunchCampaign}
                  disabled={
                    !selectedTemplate || !selectedAudience || !campaignName
                  }
                >
                  <Send className='mr-2 h-5 w-5' />
                  {scheduleType === 'now'
                    ? 'Kampagne jetzt starten'
                    : 'Kampagne planen'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
