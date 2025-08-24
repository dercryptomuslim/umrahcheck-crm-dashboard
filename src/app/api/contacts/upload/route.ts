import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Mock database - in production, use Supabase
const CONTACTS_FILE = path.join(process.cwd(), 'mock_contacts_db.json');

// Initialize mock database if it doesn't exist
function initMockDatabase() {
  if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify([]));
  }
}

// Load contacts from mock database
function loadContacts(): any[] {
  try {
    const data = fs.readFileSync(CONTACTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Save contacts to mock database
function saveContacts(contacts: any[]) {
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
}

interface ContactRow {
  email: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  country?: string;
  segment?: 'umrah_2025' | 'hajj_2025' | 'general';
  budget_min?: number;
  budget_max?: number;
  preferred_hotel_tier?: 'budget' | 'premium' | 'luxury';
  source?: string;
}

interface UploadResult {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Parse CSV content
function parseCSV(csvContent: string): ContactRow[] {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  // Validate required headers
  const requiredHeaders = ['email'];
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
  }

  const contacts: ContactRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
    const contact: ContactRow = { email: '' };

    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      if (!value) return;

      switch (header) {
        case 'email':
          contact.email = value;
          break;
        case 'first_name':
          contact.first_name = value;
          break;
        case 'last_name':
          contact.last_name = value;
          break;
        case 'city':
          contact.city = value;
          break;
        case 'country':
          contact.country = value || 'Germany';
          break;
        case 'segment':
          if (['umrah_2025', 'hajj_2025', 'general'].includes(value)) {
            contact.segment = value as 'umrah_2025' | 'hajj_2025' | 'general';
          }
          break;
        case 'budget_min':
          const budgetMin = parseInt(value);
          if (!isNaN(budgetMin)) contact.budget_min = budgetMin;
          break;
        case 'budget_max':
          const budgetMax = parseInt(value);
          if (!isNaN(budgetMax)) contact.budget_max = budgetMax;
          break;
        case 'preferred_hotel_tier':
          if (['budget', 'premium', 'luxury'].includes(value)) {
            contact.preferred_hotel_tier = value as
              | 'budget'
              | 'premium'
              | 'luxury';
          }
          break;
        case 'source':
          contact.source = value;
          break;
      }
    });

    contacts.push(contact);
  }

  return contacts;
}

// Validate contact data
function validateContact(contact: ContactRow, rowIndex: number): string[] {
  const errors: string[] = [];

  // Required fields
  if (!contact.email) {
    errors.push(`Row ${rowIndex}: Email is required`);
  } else if (!isValidEmail(contact.email)) {
    errors.push(`Row ${rowIndex}: Invalid email format: ${contact.email}`);
  }

  // Budget validation
  if (
    contact.budget_min &&
    contact.budget_max &&
    contact.budget_min > contact.budget_max
  ) {
    errors.push(
      `Row ${rowIndex}: budget_min cannot be greater than budget_max`
    );
  }

  return errors;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Initialize mock database
  initMockDatabase();

  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('csv_file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'No CSV file provided'
        },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        {
          success: false,
          message: 'File must be a CSV'
        },
        { status: 400 }
      );
    }

    console.log(
      `📤 Processing CSV upload: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
    );

    // Read file content
    const csvContent = await file.text();

    // Parse CSV
    let contacts: ContactRow[];
    try {
      contacts = parseCSV(csvContent);
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: `CSV parsing error: ${error.message}`
        },
        { status: 400 }
      );
    }

    console.log(`📊 Parsed ${contacts.length} contacts from CSV`);

    const result: UploadResult = {
      total: contacts.length,
      successful: 0,
      failed: 0,
      duplicates: 0,
      errors: []
    };

    // Process contacts in batches
    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < contacts.length; i += batchSize) {
      batches.push(contacts.slice(i, i + batchSize));
    }

    console.log(
      `🔄 Processing ${batches.length} batches of max ${batchSize} contacts each`
    );

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(
        `📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} contacts)`
      );

      for (let i = 0; i < batch.length; i++) {
        const contact = batch[i];
        const globalRowIndex = batchIndex * batchSize + i + 2; // +2 for header and 0-indexing

        // Validate contact
        const validationErrors = validateContact(contact, globalRowIndex);
        if (validationErrors.length > 0) {
          result.errors.push(...validationErrors);
          result.failed++;
          continue;
        }

        try {
          // Load existing contacts
          const existingContacts = loadContacts();

          // Check for duplicate email
          const isDuplicate = existingContacts.some(
            (c) => c.email === contact.email
          );
          if (isDuplicate) {
            result.duplicates++;
            console.log(`⚠️ Duplicate email: ${contact.email}`);
            continue;
          }

          // Set defaults
          const contactData = {
            id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: contact.email,
            first_name: contact.first_name || null,
            last_name: contact.last_name || null,
            city: contact.city || null,
            country: contact.country || 'Germany',
            segment: contact.segment || 'general',
            budget_min: contact.budget_min || 1500,
            budget_max: contact.budget_max || 3000,
            preferred_hotel_tier: contact.preferred_hotel_tier || 'premium',
            source: contact.source || 'csv_import',
            status: 'active',
            emails_sent: 0,
            emails_opened: 0,
            emails_clicked: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString()
          };

          // Add to mock database
          existingContacts.push(contactData);
          saveContacts(existingContacts);

          result.successful++;
          console.log(`✅ Successfully imported: ${contact.email}`);
        } catch (error: any) {
          result.failed++;
          result.errors.push(
            `Row ${globalRowIndex}: Unexpected error - ${error.message}`
          );
          console.error(
            `❌ Unexpected error for contact ${contact.email}:`,
            error
          );
        }
      }

      // Small delay between batches to avoid overwhelming the database
      if (batchIndex < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const processingTime = Date.now() - startTime;

    console.log(
      `🎯 CSV Import complete: ${result.successful} successful, ${result.failed} failed, ${result.duplicates} duplicates in ${processingTime}ms`
    );

    return NextResponse.json({
      success: true,
      ...result,
      processing_time_ms: processingTime,
      message: `Imported ${result.successful} contacts successfully`
    });
  } catch (error: any) {
    console.error('❌ CSV Upload API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error during CSV upload',
        error: error.message
      },
      { status: 500 }
    );
  }
}

// GET method for API info
export async function GET() {
  return NextResponse.json({
    message: 'UmrahCheck Contact Upload API',
    endpoint: 'POST /api/contacts/upload',
    version: '1.0.0',
    supported_formats: ['CSV'],
    max_file_size: '10MB',
    required_headers: ['email'],
    optional_headers: [
      'first_name',
      'last_name',
      'city',
      'country',
      'segment',
      'budget_min',
      'budget_max',
      'preferred_hotel_tier',
      'source'
    ],
    status: 'operational'
  });
}
