'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  IconMail,
  IconUserPlus,
  IconFileImport,
  IconSend,
  IconFilter,
  IconSearch
} from '@tabler/icons-react';

// Mock data for 10,000 Muslim contacts - Deterministic to avoid hydration errors
const generateMockContacts = (count: number) => {
  const names = [
    'Ahmed',
    'Fatima',
    'Omar',
    'Aisha',
    'Yusuf',
    'Zainab',
    'Ibrahim',
    'Mariam'
  ];
  const segments = ['umrah_2025', 'hajj_2025', 'general'];
  const cities = [
    'Berlin',
    'Hamburg',
    'München',
    'Frankfurt',
    'Köln',
    'Stuttgart'
  ];

  // Static base timestamp for consistent dates (March 1, 2024)
  const baseTimestamp = new Date('2024-03-01').getTime();

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${names[i % names.length]} ${names[(i + 3) % names.length]}`,
    email: `${names[i % names.length].toLowerCase()}${i + 1}@example.com`,
    segment: segments[i % segments.length],
    city: cities[i % cities.length],
    budget: `${1000 + (i % 3) * 500}-${1500 + (i % 3) * 500}`,
    // Deterministic date generation based on index
    lastActivity: new Date(
      baseTimestamp + i * 12 * 60 * 60 * 1000
    ).toISOString(),
    // Deterministic metrics based on index to avoid random values
    emailsSent: (i % 10) + 1,
    opened: Math.floor((i % 10) * 0.8),
    clicked: Math.floor((i % 10) * 0.5),
    status: i % 5 === 0 ? 'inactive' : 'active' // Every 5th contact is inactive
  }));
};

export default function ContactsPage() {
  const [contacts] = useState(generateMockContacts(50)); // Show first 50 of 10,000
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment =
      selectedSegment === 'all' || contact.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  const toggleContact = (id: number) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'umrah_2025':
        return 'bg-green-500';
      case 'hajj_2025':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-emerald-500' : 'bg-gray-400';
  };

  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Email Contacts</h1>
          <p className='text-muted-foreground'>
            Manage your 10,000+ Muslim travel contacts
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <IconFileImport className='mr-2 h-4 w-4' />
            Import CSV
          </Button>
          <Button variant='outline'>
            <IconUserPlus className='mr-2 h-4 w-4' />
            Add Contact
          </Button>
          <Button className='bg-green-600 hover:bg-green-700'>
            <IconSend className='mr-2 h-4 w-4' />
            Send Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-4 gap-4'>
        <div className='bg-card rounded-lg border p-4'>
          <div className='text-2xl font-bold'>10,247</div>
          <div className='text-muted-foreground text-sm'>Total Contacts</div>
        </div>
        <div className='bg-card rounded-lg border p-4'>
          <div className='text-2xl font-bold'>3,521</div>
          <div className='text-muted-foreground text-sm'>Umrah 2025</div>
        </div>
        <div className='bg-card rounded-lg border p-4'>
          <div className='text-2xl font-bold'>2,156</div>
          <div className='text-muted-foreground text-sm'>Hajj 2025</div>
        </div>
        <div className='bg-card rounded-lg border p-4'>
          <div className='text-2xl font-bold'>87%</div>
          <div className='text-muted-foreground text-sm'>Active Rate</div>
        </div>
      </div>

      {/* Filters */}
      <div className='flex gap-4'>
        <div className='relative flex-1'>
          <IconSearch className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />
          <Input
            placeholder='Search by name or email...'
            className='pl-10'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedSegment} onValueChange={setSelectedSegment}>
          <SelectTrigger className='w-[200px]'>
            <IconFilter className='mr-2 h-4 w-4' />
            <SelectValue placeholder='Filter by segment' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Segments</SelectItem>
            <SelectItem value='umrah_2025'>Umrah 2025</SelectItem>
            <SelectItem value='hajj_2025'>Hajj 2025</SelectItem>
            <SelectItem value='general'>General</SelectItem>
          </SelectContent>
        </Select>
        {selectedContacts.length > 0 && (
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>
              {selectedContacts.length} selected
            </span>
            <Button variant='outline' size='sm'>
              <IconMail className='mr-2 h-4 w-4' />
              Email Selected
            </Button>
          </div>
        )}
      </div>

      {/* Contacts Table */}
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-12'>
                <Checkbox
                  checked={
                    selectedContacts.length === filteredContacts.length &&
                    filteredContacts.length > 0
                  }
                  onCheckedChange={selectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead className='text-center'>Emails</TableHead>
              <TableHead className='text-center'>Opens</TableHead>
              <TableHead className='text-center'>Clicks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={() => toggleContact(contact.id)}
                  />
                </TableCell>
                <TableCell className='font-medium'>{contact.name}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>
                  <Badge className={getSegmentColor(contact.segment)}>
                    {contact.segment.replace('_', ' ').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>{contact.city}</TableCell>
                <TableCell>€{contact.budget}</TableCell>
                <TableCell className='text-center'>
                  {contact.emailsSent}
                </TableCell>
                <TableCell className='text-center'>
                  <span className='text-green-600'>{contact.opened}</span>
                </TableCell>
                <TableCell className='text-center'>
                  <span className='text-blue-600'>{contact.clicked}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant='outline'
                    className={getStatusColor(contact.status)}
                  >
                    {contact.status}
                  </Badge>
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {new Date(contact.lastActivity).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>
          Showing 1-50 of 10,247 contacts
        </p>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm'>
            Previous
          </Button>
          <Button variant='outline' size='sm'>
            1
          </Button>
          <Button variant='outline' size='sm'>
            2
          </Button>
          <Button variant='outline' size='sm'>
            3
          </Button>
          <Button variant='outline' size='sm'>
            ...
          </Button>
          <Button variant='outline' size='sm'>
            205
          </Button>
          <Button variant='outline' size='sm'>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
