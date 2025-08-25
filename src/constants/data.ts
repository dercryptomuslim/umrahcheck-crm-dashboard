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

//Info: UmrahCheck CRM Navigation - Sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Email Contacts',
    url: '/dashboard/contacts',
    icon: 'user',
    shortcut: ['c', 'c'],
    isActive: false,
    items: [
      {
        title: 'Alle Kontakte',
        url: '/dashboard/contacts',
        icon: 'user',
        shortcut: ['c', 'a']
      },
      {
        title: 'CSV Upload',
        url: '/dashboard/contacts/upload',
        icon: 'upload',
        shortcut: ['c', 'u']
      }
    ]
  },
  {
    title: 'Email Campaigns',
    url: '/dashboard/campaigns',
    icon: 'mail',
    shortcut: ['e', 'e'],
    isActive: false,
    items: []
  },
  {
    title: 'Hotel Prices',
    url: '/dashboard/hotels',
    icon: 'building',
    shortcut: ['h', 'h'],
    isActive: false,
    items: []
  },
  {
    title: 'Analytics',
    url: '/dashboard/analytics',
    icon: 'analytics',
    shortcut: ['a', 'a'],
    isActive: false,
    items: []
  },
  {
    title: 'Account',
    url: '#',
    icon: 'billing',
    isActive: true,
    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['p', 'p']
      },
      {
        title: 'Kanban',
        url: '/dashboard/kanban',
        icon: 'kanban',
        shortcut: ['k', 'k']
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
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
