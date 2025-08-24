'use client';

import { useState, useRef } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Download,
  FileText,
  Users,
  Mail
} from 'lucide-react';

interface ContactUploadResult {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

export default function ContactUploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<ContactUploadResult | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        alert('Bitte wählen Sie eine CSV-Datei aus.');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Die Datei ist zu groß. Maximale Dateigröße: 10MB');
        return;
      }

      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const uploadContacts = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('csv_file', selectedFile);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
    } catch (error) {
      alert('Upload fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `email,first_name,last_name,city,country,segment,budget_min,budget_max,preferred_hotel_tier,source
mustafa.test@example.com,Mustafa,Ali,Berlin,Germany,umrah_2025,1500,2500,premium,csv_import
sara.example@example.com,Sara,Ahmed,München,Germany,hajj_2025,2000,3500,luxury,csv_import
hassan.demo@example.com,Hassan,Khan,Hamburg,Germany,general,1000,2000,budget,csv_import`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'umrahcheck_contacts_sample.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className='container mx-auto max-w-4xl p-6'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900'>
          📧 Kontakte Importieren
        </h1>
        <p className='mt-2 text-gray-600'>
          Importieren Sie Ihre Email-Kontakte aus einer CSV-Datei in das
          UmrahCheck CRM System
        </p>
      </div>

      {/* CSV Format Instructions */}
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            CSV-Format Anforderungen
          </CardTitle>
          <CardDescription>
            Ihre CSV-Datei muss folgende Spalten enthalten (in dieser
            Reihenfolge):
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto rounded-lg bg-gray-50 p-4 font-mono text-sm'>
            <code>
              email,first_name,last_name,city,country,segment,budget_min,budget_max,preferred_hotel_tier,source
            </code>
          </div>
          <div className='mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
            <div>
              <strong>Pflichtfelder:</strong>
              <ul className='mt-1 list-inside list-disc text-gray-600'>
                <li>
                  <code>email</code> - Email-Adresse (eindeutig)
                </li>
                <li>
                  <code>first_name</code> - Vorname
                </li>
                <li>
                  <code>city</code> - Stadt
                </li>
              </ul>
            </div>
            <div>
              <strong>Optionale Felder:</strong>
              <ul className='mt-1 list-inside list-disc text-gray-600'>
                <li>
                  <code>segment</code> - umrah_2025, hajj_2025, general
                </li>
                <li>
                  <code>budget_min/max</code> - Budget in EUR
                </li>
                <li>
                  <code>preferred_hotel_tier</code> - budget, premium, luxury
                </li>
              </ul>
            </div>
          </div>

          <div className='mt-4'>
            <Button
              variant='outline'
              onClick={downloadSampleCSV}
              className='flex items-center gap-2'
            >
              <Download className='h-4 w-4' />
              Beispiel CSV herunterladen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Upload className='h-5 w-5' />
            CSV-Datei hochladen
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='csv-file'>CSV-Datei auswählen</Label>
            <Input
              id='csv-file'
              type='file'
              accept='.csv,text/csv,application/csv'
              onChange={handleFileSelect}
              ref={fileInputRef}
              disabled={isUploading}
              className='file:bg-primary file:text-primary-foreground hover:file:bg-primary/80 mt-1 cursor-pointer file:cursor-pointer file:rounded-md file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium'
            />
            {selectedFile && (
              <div className='mt-2 text-sm text-gray-600'>
                Ausgewählte Datei: <strong>{selectedFile.name}</strong>(
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          {selectedFile && (
            <Button
              onClick={uploadContacts}
              disabled={isUploading}
              className='flex w-full items-center gap-2'
            >
              <Upload className='h-4 w-4' />
              {isUploading
                ? 'Kontakte werden importiert...'
                : 'Kontakte importieren'}
            </Button>
          )}

          {isUploading && (
            <div className='space-y-2'>
              <Progress value={uploadProgress} className='w-full' />
              <p className='text-center text-sm text-gray-600'>
                Import läuft... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              {uploadResult.failed === 0 ? (
                <CheckCircle className='h-5 w-5 text-green-500' />
              ) : (
                <AlertCircle className='h-5 w-5 text-yellow-500' />
              )}
              Import Ergebnis
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              <div className='rounded-lg bg-blue-50 p-4 text-center'>
                <Users className='mx-auto mb-2 h-8 w-8 text-blue-500' />
                <div className='text-2xl font-bold text-blue-600'>
                  {uploadResult.total}
                </div>
                <div className='text-sm text-gray-600'>Gesamt</div>
              </div>
              <div className='rounded-lg bg-green-50 p-4 text-center'>
                <CheckCircle className='mx-auto mb-2 h-8 w-8 text-green-500' />
                <div className='text-2xl font-bold text-green-600'>
                  {uploadResult.successful}
                </div>
                <div className='text-sm text-gray-600'>Erfolgreich</div>
              </div>
              <div className='rounded-lg bg-red-50 p-4 text-center'>
                <AlertCircle className='mx-auto mb-2 h-8 w-8 text-red-500' />
                <div className='text-2xl font-bold text-red-600'>
                  {uploadResult.failed}
                </div>
                <div className='text-sm text-gray-600'>Fehlgeschlagen</div>
              </div>
              <div className='rounded-lg bg-yellow-50 p-4 text-center'>
                <Mail className='mx-auto mb-2 h-8 w-8 text-yellow-500' />
                <div className='text-2xl font-bold text-yellow-600'>
                  {uploadResult.duplicates}
                </div>
                <div className='text-sm text-gray-600'>Duplikate</div>
              </div>
            </div>

            {uploadResult.failed === 0 ? (
              <Alert>
                <CheckCircle className='h-4 w-4' />
                <AlertDescription>
                  🎉 Alle Kontakte wurden erfolgreich importiert! Sie können nun
                  Email-Kampagnen starten.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  {uploadResult.successful} Kontakte erfolgreich importiert,{' '}
                  {uploadResult.failed} fehlgeschlagen. Überprüfen Sie die
                  Fehler unten.
                </AlertDescription>
              </Alert>
            )}

            {uploadResult.errors.length > 0 && (
              <div className='space-y-2'>
                <h4 className='font-semibold text-red-600'>Fehler Details:</h4>
                <div className='max-h-40 overflow-y-auto rounded-lg bg-red-50 p-4'>
                  {uploadResult.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className='mb-1 text-sm text-red-700'>
                      • {error}
                    </div>
                  ))}
                  {uploadResult.errors.length > 10 && (
                    <div className='text-sm font-semibold text-red-600'>
                      ... und {uploadResult.errors.length - 10} weitere Fehler
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
