import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: UmrahCheck CRM Navigation - Deutsche Sidebar Navigation für Islamische Reiseorganisationen
export const navItems: NavItem[] = [
  {
    title: 'Übersicht',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Reisende verwalten',
    url: '/dashboard/contacts',
    icon: 'user',
    shortcut: ['r', 'r'],
    isActive: false,
    items: [
      {
        title: 'Alle Reisenden',
        url: '/dashboard/contacts',
        icon: 'user',
        shortcut: ['r', 'a']
      },
      {
        title: 'CSV Daten hochladen',
        url: '/dashboard/contacts/upload',
        icon: 'upload',
        shortcut: ['c', 'u']
      },
      {
        title: 'Gruppen verwalten',
        url: '/dashboard/contacts/groups',
        icon: 'users',
        shortcut: ['r', 'g']
      }
    ]
  },
  {
    title: 'Reise Buchungen',
    url: '/dashboard/bookings',
    icon: 'plane',
    shortcut: ['b', 'b'],
    isActive: false,
    items: [
      {
        title: 'Alle Buchungen',
        url: '/dashboard/bookings',
        icon: 'plane',
        shortcut: ['b', 'a']
      },
      {
        title: 'Umrah Pakete',
        url: '/dashboard/bookings/umrah',
        icon: 'mosque',
        shortcut: ['u', 'p']
      },
      {
        title: 'Hajj Pakete',
        url: '/dashboard/bookings/hajj',
        icon: 'mosque',
        shortcut: ['h', 'p']
      },
      {
        title: 'Visa & Dokumente',
        url: '/dashboard/bookings/documents',
        icon: 'document',
        shortcut: ['v', 'd']
      }
    ]
  },
  {
    title: 'Hotel & Unterkünfte',
    url: '/dashboard/hotels',
    icon: 'building',
    shortcut: ['h', 'h'],
    isActive: false,
    items: [
      {
        title: 'Makkah Hotels',
        url: '/dashboard/hotels/makkah',
        icon: 'mosque',
        shortcut: ['h', 'm']
      },
      {
        title: 'Madinah Hotels',
        url: '/dashboard/hotels/madinah',
        icon: 'mosque',
        shortcut: ['h', 'md']
      },
      {
        title: 'Preise verwalten',
        url: '/dashboard/hotels/pricing',
        icon: 'dollar',
        shortcut: ['h', 'p']
      }
    ]
  },
  {
    title: 'Kommunikation',
    url: '/dashboard/campaigns',
    icon: 'mail',
    shortcut: ['k', 'k'],
    isActive: false,
    items: [
      {
        title: 'E-Mail Kampagnen',
        url: '/dashboard/campaigns',
        icon: 'mail',
        shortcut: ['k', 'e']
      },
      {
        title: 'WhatsApp Nachrichten',
        url: '/dashboard/campaigns/whatsapp',
        icon: 'phone',
        shortcut: ['k', 'w']
      },
      {
        title: 'SMS Benachrichtigung',
        url: '/dashboard/campaigns/sms',
        icon: 'message',
        shortcut: ['k', 's']
      }
    ]
  },
  {
    title: 'Berichte & Analyse',
    url: '/dashboard/analytics',
    icon: 'analytics',
    shortcut: ['a', 'a'],
    isActive: false,
    items: [
      {
        title: 'Buchungsstatistiken',
        url: '/dashboard/analytics/bookings',
        icon: 'chart',
        shortcut: ['a', 'b']
      },
      {
        title: 'Finanzberichte',
        url: '/dashboard/analytics/finance',
        icon: 'dollar',
        shortcut: ['a', 'f']
      },
      {
        title: 'Kundenzufriedenheit',
        url: '/dashboard/analytics/satisfaction',
        icon: 'heart',
        shortcut: ['a', 'z']
      }
    ]
  },
  {
    title: 'AI Assistent',
    url: '/dashboard/ai',
    icon: 'ai',
    shortcut: ['i', 'i'],
    isActive: false,
    items: [
      {
        title: 'Smart Empfehlungen',
        url: '/dashboard/ai/recommendations',
        icon: 'ai',
        shortcut: ['i', 'e']
      },
      {
        title: 'Preis Optimierung',
        url: '/dashboard/ai/pricing',
        icon: 'dollar',
        shortcut: ['i', 'p']
      },
      {
        title: 'Chat Support',
        url: '/dashboard/ai/chat',
        icon: 'message',
        shortcut: ['i', 'c']
      }
    ]
  },
  {
    title: 'Organisation',
    url: '#',
    icon: 'building',
    isActive: true,
    items: [
      {
        title: 'Profil verwalten',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['p', 'p']
      },
      {
        title: 'Team & Rollen',
        url: '/dashboard/team',
        icon: 'users',
        shortcut: ['t', 't']
      },
      {
        title: 'Einstellungen',
        url: '/dashboard/settings',
        icon: 'settings',
        shortcut: ['s', 's']
      },
      {
        title: 'Abrechnung',
        url: '/dashboard/billing',
        icon: 'billing',
        shortcut: ['b', 'r']
      }
    ]
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Ahmed Al-Mahmoud',
    email: 'ahmed.mahmoud@mosque-berlin.de',
    amount: '+€3,499.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'AM'
  },
  {
    id: 2,
    name: 'Fatima Al-Zahra',
    email: 'fatima.zahra@islamverein-hamburg.de',
    amount: '+€2,850.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'FZ'
  },
  {
    id: 3,
    name: 'Omar Ibn Khattab Moschee',
    email: 'buchung@omar-moschee-koeln.de',
    amount: '+€5,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'OM'
  },
  {
    id: 4,
    name: 'Aisha Muhammad',
    email: 'aisha@islamcenter-muenchen.de',
    amount: '+€4,250.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'AM'
  },
  {
    id: 5,
    name: 'Bilal Travel Stuttgart',
    email: 'info@bilaltravel-stuttgart.de',
    amount: '+€1,890.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'BT'
  }
];
