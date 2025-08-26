import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';

const recentBookingsData = [
  {
    name: 'Ahmed Al-Mahmoud',
    email: 'ahmed.mahmoud@mosque-berlin.de',
    avatar: 'https://api.slingacademy.com/public/sample-users/1.png',
    fallback: 'AM',
    amount: '+€3.499',
    package: '🕌 Umrah Premium',
    status: 'confirmed'
  },
  {
    name: 'Fatima Al-Zahra',
    email: 'fatima.zahra@islamverein-hamburg.de',
    avatar: 'https://api.slingacademy.com/public/sample-users/2.png',
    fallback: 'FZ',
    amount: '+€2.850',
    package: '🕋 Hajj Standard',
    status: 'pending'
  },
  {
    name: 'Omar Ibn Khattab Moschee',
    email: 'buchung@omar-moschee-koeln.de',
    avatar: 'https://api.slingacademy.com/public/sample-users/3.png',
    fallback: 'OM',
    amount: '+€5.999',
    package: '🏨 Umrah Luxus Gruppe',
    status: 'confirmed'
  },
  {
    name: 'Aisha Muhammad',
    email: 'aisha@islamcenter-muenchen.de',
    avatar: 'https://api.slingacademy.com/public/sample-users/4.png',
    fallback: 'AM',
    amount: '+€4.250',
    package: '✈️ Hajj Premium',
    status: 'confirmed'
  },
  {
    name: 'Bilal Travel Stuttgart',
    email: 'info@bilaltravel-stuttgart.de',
    avatar: 'https://api.slingacademy.com/public/sample-users/5.png',
    fallback: 'BT',
    amount: '+€1.890',
    package: '🌙 Umrah Basic',
    status: 'processing'
  }
];

export function RecentSales() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '✅ Bestätigt';
      case 'pending':
        return '⏳ Wartend';
      case 'processing':
        return '🔄 Bearbeitung';
      default:
        return status;
    }
  };

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>🧳 Aktuelle Buchungen</CardTitle>
        <CardDescription>
          Sie haben 127 Buchungen diesen Monat abgeschlossen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {recentBookingsData.map((booking, index) => (
            <div
              key={index}
              className='flex items-center justify-between border-b pb-4 last:border-b-0'
            >
              <div className='flex items-center'>
                <Avatar className='h-10 w-10'>
                  <AvatarImage src={booking.avatar} alt='Avatar' />
                  <AvatarFallback>{booking.fallback}</AvatarFallback>
                </Avatar>
                <div className='ml-4 space-y-1'>
                  <p className='text-sm leading-none font-medium'>
                    {booking.name}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {booking.email}
                  </p>
                  <p className='text-xs font-medium text-blue-600'>
                    {booking.package}
                  </p>
                </div>
              </div>
              <div className='space-y-1 text-right'>
                <div className='font-bold text-green-600'>{booking.amount}</div>
                <div
                  className={`rounded-full px-2 py-1 text-xs ${getStatusColor(booking.status)}`}
                >
                  {getStatusText(booking.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
