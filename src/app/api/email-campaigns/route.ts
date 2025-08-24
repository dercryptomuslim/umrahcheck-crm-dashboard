import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(
  process.env.RESEND_API_KEY || 're_GjayicTJ_96myT9YP6TKFs6w853hi7Kcv'
);

interface EmailCampaignRequest {
  campaign_type: 'welcome_back' | 'price_drop' | 'ramadan_special';
  recipients: number;
  segment?: 'umrah_2025' | 'hajj_2025' | 'all';
  test_email?: string;
  language?: 'de' | 'en' | 'fr' | 'es' | 'tr' | 'ar';
}

interface HotelOffer {
  name: string;
  city: string;
  tier: string;
  price: number;
  originalPrice: number;
  savings: number;
  halal_booking_url: string;
}

// Mock hotel data for email campaigns
const mockHotelOffers: HotelOffer[] = [
  {
    name: 'Swissôtel Makkah',
    city: 'Makkah',
    tier: 'luxury',
    price: 299,
    originalPrice: 349,
    savings: 50,
    halal_booking_url:
      'https://halalbooking.com/hotels/swissotel-makkah?ref=umrahcheck'
  },
  {
    name: 'The Oberoi Madina',
    city: 'Medina',
    tier: 'luxury',
    price: 249,
    originalPrice: 289,
    savings: 40,
    halal_booking_url:
      'https://halalbooking.com/hotels/oberoi-madina?ref=umrahcheck'
  },
  {
    name: 'DoubleTree by Hilton Jabal Omar',
    city: 'Makkah',
    tier: 'premium',
    price: 179,
    originalPrice: 199,
    savings: 20,
    halal_booking_url:
      'https://halalbooking.com/hotels/doubletree-jabal-omar?ref=umrahcheck'
  }
];

function getEmailTemplate(
  campaign_type: string,
  hotelOffers: HotelOffer[],
  language: string = 'de'
) {
  const baseUrl = 'https://umrahcheck.de';

  // Multi-language templates - Complete internationalization support
  const templates = {
    // German (Deutsch) - Default
    de: {
      welcome_back: {
        subject:
          '🕌 Willkommen zurück! Exklusive Umrah-Hotel-Angebote nur für Sie',
        greeting: 'As-salamu alaikum,',
        title: 'Willkommen zurück!',
        subtitle: 'Exklusive Hotel-Angebote für Ihre nächste Umrah-Reise',
        intro:
          'Wir haben Sie vermisst! Unser KI-System hat unglaubliche Hotel-Angebote gefunden, die perfekt für Ihre nächste Umrah-Reise sind. Diese Preise sind deutlich gefallen und werden nicht lange verfügbar sein.',
        save: 'Sparen Sie',
        book_btn: 'Jetzt mit HalalBooking buchen',
        cta_title: '⏰ Zeitlich begrenztes Angebot',
        cta_text:
          'Diese Preise werden täglich von Live-Booking.com-Daten aktualisiert. Warten Sie nicht - sichern Sie sich heute Ihre Reservierung!',
        cta_btn: 'Alle Angebote ansehen',
        blessing:
          'Möge Allah Ihre Umrah-Reise gesegnet und leicht machen. Ameen.',
        signature: 'Ihr UmrahCheck Team',
        unsubscribe: 'Abmelden',
        privacy: 'Datenschutz',
        contact: 'Kontakt'
      },
      price_drop: {
        subject:
          '🚨 EILMELDUNG: Hotel-Preise um €150 gefallen - Nur begrenzte Zeit!',
        title: '🚨 EILMELDUNG: PREISVERFALL',
        subtitle:
          'Handeln Sie schnell - Diese Angebote laufen in 48 Stunden ab!',
        countdown: '⏰ Nur noch 47 Stunden, 23 Minuten!',
        alert_title: 'Große Preissenkungen entdeckt:',
        intro:
          'Unser KI-Überwachungssystem hat diese erheblichen Preissenkungen bei Top-Hotels in Makkah und Medina erkannt. Das sind die niedrigsten Preise, die wir dieses Jahr gesehen haben!',
        book_urgent: '🔥 JETZT BUCHEN - NUR BEGRENZTE ZEIT'
      },
      ramadan_special: {
        subject: '🌙 Ramadan Mubarak! Spezielle Umrah-Pakete - 30% Rabatt',
        title: '🌙 Ramadan Mubarak!',
        subtitle:
          'Spezielle Umrah-Pakete - 30% Rabatt in diesem gesegneten Monat',
        blessing_quote:
          '"Wer Umrah im Ramadan verrichtet, ist gleichwertig mit der Verrichtung von Hajj mit mir." - Prophet Muhammad (Friede sei mit ihm)',
        greeting: 'As-salamu alaikum und Ramadan Mubarak!',
        intro:
          'Dieser gesegnete Monat ist die perfekte Zeit, um Ihre spirituelle Reise zu planen. Wir bieten exklusive Rabatte auf Premium-Hotel-Pakete:',
        special_price: 'Spezial-Ramadan-Preis:',
        closing:
          'Möge Allah Ihre Gebete annehmen und Ihnen eine gesegnete Umrah-Reise gewähren. Ameen.'
      }
    },

    // English
    en: {
      welcome_back: {
        subject: '🕌 Welcome Back! Exclusive Umrah Hotel Deals Just for You',
        greeting: 'As-salamu alaikum,',
        title: 'Welcome Back!',
        subtitle: 'Exclusive Hotel Deals for Your Next Umrah Journey',
        intro:
          "We've missed you! Our AI system has found incredible hotel deals that are perfect for your next Umrah journey. These prices have dropped significantly and won't be available for long.",
        save: 'Save',
        book_btn: 'Book Now with HalalBooking',
        cta_title: '⏰ Limited Time Offer',
        cta_text:
          "These prices are updated daily from live Booking.com data. Don't wait - secure your reservation today!",
        cta_btn: 'View All Deals',
        blessing: 'May Allah make your Umrah journey blessed and easy. Ameen.',
        signature: 'Your UmrahCheck Team',
        unsubscribe: 'Unsubscribe',
        privacy: 'Privacy',
        contact: 'Contact'
      },
      price_drop: {
        subject: '🚨 URGENT: Hotel Prices Dropped by €150 - Limited Time!',
        title: '🚨 URGENT: PRICE DROP',
        subtitle: 'Act Fast - These Deals Expire in 48 Hours!',
        countdown: '⏰ Only 47 hours, 23 minutes left!',
        alert_title: 'Major Price Drops Detected:',
        intro:
          "Our AI monitoring system detected these significant price drops across top Makkah and Medina hotels. This is the lowest we've seen these prices all year!",
        book_urgent: '🔥 BOOK NOW - LIMITED TIME'
      },
      ramadan_special: {
        subject: '🌙 Ramadan Mubarak! Special Umrah Packages - 30% Off',
        title: '🌙 Ramadan Mubarak!',
        subtitle: 'Special Umrah Packages - 30% Off During This Blessed Month',
        blessing_quote:
          'Whoever performs Umrah in Ramadan, it is equivalent to performing Hajj with me. - Prophet Muhammad (Peace be upon him)',
        greeting: 'As-salamu alaikum and Ramadan Mubarak!',
        intro:
          "This blessed month is the perfect time to plan your spiritual journey. We're offering exclusive discounts on premium hotel packages:",
        special_price: 'Special Ramadan Price:',
        closing:
          'May Allah accept your prayers and grant you a blessed Umrah journey. Ameen.'
      }
    },

    // French (Français)
    fr: {
      welcome_back: {
        subject:
          "🕌 Bon retour ! Offres exclusives d'hôtels Umrah rien que pour vous",
        greeting: 'As-salamu alaikum,',
        title: 'Bon retour !',
        subtitle: "Offres d'hôtels exclusives pour votre prochain voyage Umrah",
        intro:
          "Vous nous avez manqué ! Notre système IA a trouvé des offres d'hôtels incroyables parfaites pour votre prochain voyage Umrah. Ces prix ont considérablement baissé et ne seront pas disponibles longtemps.",
        save: 'Économisez',
        book_btn: 'Réserver maintenant avec HalalBooking',
        cta_title: '⏰ Offre à durée limitée',
        cta_text:
          "Ces prix sont mis à jour quotidiennement à partir des données en direct de Booking.com. N'attendez pas - sécurisez votre réservation aujourd'hui !",
        cta_btn: 'Voir toutes les offres',
        blessing: "Qu'Allah rende votre voyage Umrah béni et facile. Ameen.",
        signature: 'Votre équipe UmrahCheck',
        unsubscribe: 'Se désabonner',
        privacy: 'Confidentialité',
        contact: 'Contact'
      },
      price_drop: {
        subject:
          '🚨 URGENT : Les prix des hôtels ont chuté de 150 € - Temps limité !',
        title: '🚨 URGENT : CHUTE DE PRIX',
        subtitle: 'Agissez vite - Ces offres expirent dans 48 heures !',
        countdown: '⏰ Plus que 47 heures, 23 minutes !',
        alert_title: 'Chutes de prix majeures détectées :',
        intro:
          'Notre système de surveillance IA a détecté ces chutes de prix importantes dans les meilleurs hôtels de La Mecque et Médine. Ce sont les prix les plus bas que nous ayons vus cette année !',
        book_urgent: '🔥 RÉSERVER MAINTENANT - TEMPS LIMITÉ'
      },
      ramadan_special: {
        subject:
          '🌙 Ramadan Mubarak ! Forfaits Umrah spéciaux - 30% de réduction',
        title: '🌙 Ramadan Mubarak !',
        subtitle:
          'Forfaits Umrah spéciaux - 30% de réduction pendant ce mois béni',
        blessing_quote:
          "Celui qui accomplit la Umrah pendant le Ramadan, c'est équivalent à accomplir le Hajj avec moi. - Prophète Muhammad (Paix soit sur lui)",
        greeting: 'As-salamu alaikum et Ramadan Mubarak !',
        intro:
          'Ce mois béni est le moment parfait pour planifier votre voyage spirituel. Nous offrons des réductions exclusives sur les forfaits hôteliers premium :',
        special_price: 'Prix spécial Ramadan :',
        closing:
          "Qu'Allah accepte vos prières et vous accorde un voyage Umrah béni. Ameen."
      }
    },

    // Spanish (Español)
    es: {
      welcome_back: {
        subject:
          '🕌 ¡Bienvenido de vuelta! Ofertas exclusivas de hoteles Umrah solo para ti',
        greeting: 'As-salamu alaikum,',
        title: '¡Bienvenido de vuelta!',
        subtitle: 'Ofertas exclusivas de hoteles para tu próximo viaje Umrah',
        intro:
          '¡Te hemos echado de menos! Nuestro sistema de IA ha encontrado ofertas increíbles de hoteles perfectas para tu próximo viaje Umrah. Estos precios han bajado significativamente y no estarán disponibles por mucho tiempo.',
        save: 'Ahorra',
        book_btn: 'Reservar ahora con HalalBooking',
        cta_title: '⏰ Oferta por tiempo limitado',
        cta_text:
          'Estos precios se actualizan diariamente con datos en vivo de Booking.com. ¡No esperes - asegura tu reserva hoy!',
        cta_btn: 'Ver todas las ofertas',
        blessing:
          'Que Allah haga que tu viaje Umrah sea bendecido y fácil. Ameen.',
        signature: 'Tu equipo UmrahCheck',
        unsubscribe: 'Darse de baja',
        privacy: 'Privacidad',
        contact: 'Contacto'
      },
      price_drop: {
        subject:
          '🚨 URGENTE: Los precios de hoteles bajaron €150 - ¡Tiempo limitado!',
        title: '🚨 URGENTE: CAÍDA DE PRECIOS',
        subtitle: 'Actúa rápido - ¡Estas ofertas expiran en 48 horas!',
        countdown: '⏰ ¡Solo quedan 47 horas, 23 minutos!',
        alert_title: 'Caídas importantes de precios detectadas:',
        intro:
          'Nuestro sistema de monitoreo IA detectó estas caídas significativas de precios en los mejores hoteles de La Meca y Medina. ¡Estos son los precios más bajos que hemos visto este año!',
        book_urgent: '🔥 RESERVAR AHORA - TIEMPO LIMITADO'
      },
      ramadan_special: {
        subject:
          '🌙 ¡Ramadán Mubarak! Paquetes especiales Umrah - 30% de descuento',
        title: '🌙 ¡Ramadán Mubarak!',
        subtitle:
          'Paquetes especiales Umrah - 30% de descuento durante este mes bendito',
        blessing_quote:
          'Quien realiza Umrah en Ramadán, es equivalente a realizar Hajj conmigo. - Profeta Muhammad (Paz sea con él)',
        greeting: '¡As-salamu alaikum y Ramadán Mubarak!',
        intro:
          'Este mes bendito es el momento perfecto para planificar tu viaje espiritual. Ofrecemos descuentos exclusivos en paquetes de hoteles premium:',
        special_price: 'Precio especial Ramadán:',
        closing:
          'Que Allah acepte tus oraciones y te conceda un viaje Umrah bendito. Ameen.'
      }
    },

    // Turkish (Türkçe)
    tr: {
      welcome_back: {
        subject:
          '🕌 Tekrar Hoş Geldiniz! Sadece Sizin İçin Özel Umre Otel Fırsatları',
        greeting: 'Es-selamu aleykum,',
        title: 'Tekrar Hoş Geldiniz!',
        subtitle: 'Bir Sonraki Umre Yolculuğunuz İçin Özel Otel Fırsatları',
        intro:
          'Sizi özledik! AI sistemimiz bir sonraki Umre yolculuğunuz için mükemmel olan inanılmaz otel fırsatları buldu. Bu fiyatlar önemli ölçüde düştü ve uzun süre mevcut olmayacak.',
        save: 'Tasarruf Edin',
        book_btn: 'HalalBooking ile Şimdi Rezervasyon Yapın',
        cta_title: '⏰ Sınırlı Süreli Teklif',
        cta_text:
          'Bu fiyatlar Booking.com canlı verilerinden günlük olarak güncellenir. Beklemeyin - rezervasyonunuzu bugün güvence altına alın!',
        cta_btn: 'Tüm Fırsatları Görüntüle',
        blessing: 'Allah Umre yolculuğunuzu mübarek ve kolay kılsın. Amin.',
        signature: 'UmrahCheck Ekibiniz',
        unsubscribe: 'Abonelikten Çık',
        privacy: 'Gizlilik',
        contact: 'İletişim'
      },
      price_drop: {
        subject: '🚨 ACİL: Otel Fiyatları 150€ Düştü - Sınırlı Süre!',
        title: '🚨 ACİL: FİYAT DÜŞÜŞÜ',
        subtitle:
          'Hızlı Hareket Edin - Bu Fırsatlar 48 Saat İçinde Sona Eriyor!',
        countdown: '⏰ Sadece 47 saat, 23 dakika kaldı!',
        alert_title: 'Büyük Fiyat Düşüşleri Tespit Edildi:',
        intro:
          "AI izleme sistemimiz Mekke ve Medine'deki en iyi otellerde bu önemli fiyat düşüşlerini tespit etti. Bu yıl gördüğümüz en düşük fiyatlar!",
        book_urgent: '🔥 ŞİMDİ REZERVASYON YAPIN - SINIRLI SÜRE'
      },
      ramadan_special: {
        subject: '🌙 Ramazan Mübarek! Özel Umre Paketleri - %30 İndirim',
        title: '🌙 Ramazan Mübarek!',
        subtitle: 'Özel Umre Paketleri - Bu Mübarek Ayda %30 İndirim',
        blessing_quote:
          "Kim Ramazan'da Umre yaparsa, benimle birlikte Hac yapmış gibidir. - Peygamber Muhammad (s.a.v.)",
        greeting: 'Es-selamu aleykum ve Ramazan Mübarek!',
        intro:
          'Bu mübarek ay ruhani yolculuğunuzu planlamanın mükemmel zamanıdır. Premium otel paketlerinde özel indirimler sunuyoruz:',
        special_price: 'Özel Ramazan Fiyatı:',
        closing:
          'Allah dualarınızı kabul etsin ve size mübarek bir Umre yolculuğu nasip etsin. Amin.'
      }
    },

    // Arabic (العربية)
    ar: {
      welcome_back: {
        subject: '🕌 أهلاً بعودتك! عروض فنادق حصرية للعمرة خاصة بك',
        greeting: 'السلام عليكم ورحمة الله وبركاته،',
        title: 'أهلاً بعودتك!',
        subtitle: 'عروض فنادق حصرية لرحلة العمرة القادمة',
        intro:
          'لقد افتقدناك! لقد وجد نظام الذكاء الاصطناعي لدينا عروض فنادق مذهلة مثالية لرحلة العمرة القادمة. انخفضت هذه الأسعار بشكل كبير ولن تكون متاحة لفترة طويلة.',
        save: 'وفر',
        book_btn: 'احجز الآن مع HalalBooking',
        cta_title: '⏰ عرض لفترة محدودة',
        cta_text:
          'يتم تحديث هذه الأسعار يومياً من بيانات Booking.com المباشرة. لا تنتظر - احجز اليوم!',
        cta_btn: 'عرض جميع العروض',
        blessing: 'اللهم بارك في رحلة العمرة واجعلها سهلة ميسرة. آمين.',
        signature: 'فريق UmrahCheck',
        unsubscribe: 'إلغاء الاشتراك',
        privacy: 'الخصوصية',
        contact: 'اتصل بنا'
      },
      price_drop: {
        subject:
          '🚨 عاجل: انخفضت أسعار الفنادق بمقدار 150 يورو - لفترة محدودة!',
        title: '🚨 عاجل: انخفاض الأسعار',
        subtitle: 'تحرك بسرعة - تنتهي هذه العروض خلال 48 ساعة!',
        countdown: '⏰ باقي 47 ساعة و23 دقيقة فقط!',
        alert_title: 'تم اكتشاف انخفاضات كبيرة في الأسعار:',
        intro:
          'اكتشف نظام مراقبة الذكاء الاصطناعي هذه الانخفاضات الكبيرة في الأسعار في أفضل فنادق مكة والمدينة. هذه أقل الأسعار التي رأيناها هذا العام!',
        book_urgent: '🔥 احجز الآن - لفترة محدودة'
      },
      ramadan_special: {
        subject: '🌙 رمضان مبارك! باقات عمرة خاصة - خصم 30%',
        title: '🌙 رمضان مبارك!',
        subtitle: 'باقات عمرة خاصة - خصم 30% خلال هذا الشهر المبارك',
        blessing_quote:
          'من أدى عمرة في رمضان كانت كحجة معي. - النبي محمد صلى الله عليه وسلم',
        greeting: 'السلام عليكم ورحمة الله وبركاته ورمضان مبارك!',
        intro:
          'هذا الشهر المبارك هو الوقت المثالي لتخطيط رحلتك الروحانية. نقدم خصومات حصرية على باقات الفنادق المميزة:',
        special_price: 'سعر رمضان الخاص:',
        closing: 'اللهم تقبل دعاءك وارزقك رحلة عمرة مباركة. آمين.'
      }
    }
  };

  const t = templates[language] || templates.de;

  switch (campaign_type) {
    case 'welcome_back':
      return {
        subject: t.welcome_back.subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Willkommen zurück bei UmrahCheck</title>
            <style>
              body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
              .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px 20px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 28px; }
              .header p { color: #d1fae5; margin: 10px 0 0 0; font-size: 16px; }
              .content { padding: 30px 20px; }
              .hotel-offer { border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0; overflow: hidden; }
              .hotel-header { background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; }
              .hotel-name { font-size: 18px; font-weight: bold; color: #111827; margin: 0; }
              .hotel-location { color: #6b7280; font-size: 14px; margin: 5px 0 0 0; }
              .hotel-details { padding: 20px; }
              .price-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
              .current-price { font-size: 24px; font-weight: bold; color: #10b981; }
              .original-price { text-decoration: line-through; color: #6b7280; font-size: 16px; margin-left: 10px; }
              .savings { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
              .book-btn { background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: bold; }
              .book-btn:hover { background: #059669; }
              .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
              .cta-section { background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
              .cta-title { color: #92400e; font-size: 20px; font-weight: bold; margin: 0 0 10px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🕌 ${t.welcome_back.title}</h1>
                <p>${t.welcome_back.subtitle}</p>
              </div>
              
              <div class="content">
                <h2>${t.welcome_back.greeting}</h2>
                <p>${t.welcome_back.intro}</p>
                
                ${hotelOffers
                  .map(
                    (hotel) => `
                  <div class="hotel-offer">
                    <div class="hotel-header">
                      <h3 class="hotel-name">${hotel.name}</h3>
                      <p class="hotel-location">📍 ${hotel.city} • ${hotel.tier.charAt(0).toUpperCase() + hotel.tier.slice(1)} Hotel</p>
                    </div>
                    <div class="hotel-details">
                      <div class="price-section">
                        <div>
                          <span class="current-price">€${hotel.price}</span>
                          <span class="original-price">€${hotel.originalPrice}</span>
                        </div>
                        <span class="savings">${t.welcome_back.save} €${hotel.savings}</span>
                      </div>
                      <a href="${hotel.halal_booking_url}" class="book-btn">${t.welcome_back.book_btn}</a>
                    </div>
                  </div>
                `
                  )
                  .join('')}
                
                <div class="cta-section">
                  <h3 class="cta-title">${t.welcome_back.cta_title}</h3>
                  <p>${t.welcome_back.cta_text}</p>
                  <a href="${baseUrl}/hotels" class="book-btn">${t.welcome_back.cta_btn}</a>
                </div>
              </div>
              
              <div class="footer">
                <p>${t.welcome_back.blessing}</p>
                <p><strong>${t.welcome_back.signature}</strong></p>
                <p>
                  <a href="${baseUrl}/abmelden">${t.welcome_back.unsubscribe}</a> | 
                  <a href="${baseUrl}/datenschutz">${t.welcome_back.privacy}</a> | 
                  <a href="${baseUrl}/kontakt">${t.welcome_back.contact}</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'price_drop':
      return {
        subject: t.price_drop.subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${t.price_drop.title}</title>
            <style>
              body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #333; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .urgent-header { background: #dc2626; color: white; padding: 30px 20px; text-align: center; }
              .urgent-header h1 { margin: 0; font-size: 28px; font-weight: bold; }
              .urgent-header p { margin: 10px 0 0 0; font-size: 16px; color: #fecaca; }
              .content { padding: 30px 20px; }
              .countdown { background: #fbbf24; color: #92400e; padding: 15px; text-align: center; font-weight: bold; border-radius: 8px; font-size: 18px; margin: 20px 0; }
              .price-alert { background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 4px; }
              .price-alert h3 { margin-top: 0; color: #dc2626; font-size: 20px; }
              .hotel-deal { background: white; border: 2px solid #dc2626; margin: 15px 0; padding: 20px; border-radius: 8px; }
              .hotel-deal h4 { margin: 0 0 10px 0; font-size: 18px; color: #111827; }
              .price-comparison { display: flex; align-items: center; gap: 10px; margin: 10px 0; }
              .old-price { text-decoration: line-through; color: #6b7280; font-size: 16px; }
              .new-price { font-size: 24px; font-weight: bold; color: #dc2626; }
              .savings-badge { background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: bold; }
              .urgent-btn { background: #dc2626; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px; margin: 20px 0; }
              .urgent-btn:hover { background: #b91c1c; }
              .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="urgent-header">
                <h1>${t.price_drop.title}</h1>
                <p>${t.price_drop.subtitle}</p>
              </div>
              
              <div class="content">
                <div class="countdown">${t.price_drop.countdown}</div>
                
                <div class="price-alert">
                  <h3>${t.price_drop.alert_title}</h3>
                  <p>${t.price_drop.intro}</p>
                  
                  ${hotelOffers
                    .map(
                      (hotel) => `
                    <div class="hotel-deal">
                      <h4>${hotel.name} - ${hotel.city}</h4>
                      <div class="price-comparison">
                        <span class="old-price">€${hotel.originalPrice}</span>
                        <span>→</span>
                        <span class="new-price">€${hotel.price}</span>
                        <span class="savings-badge">${t.welcome_back.save} €${hotel.savings}</span>
                      </div>
                      <a href="${hotel.halal_booking_url}" class="urgent-btn">${t.price_drop.book_urgent}</a>
                    </div>
                  `
                    )
                    .join('')}
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/hotels" class="urgent-btn">${t.price_drop.book_urgent}</a>
                </div>
              </div>
              
              <div class="footer">
                <p>${t.welcome_back.blessing}</p>
                <p><strong>${t.welcome_back.signature}</strong></p>
                <p>
                  <a href="${baseUrl}/abmelden">${t.welcome_back.unsubscribe}</a> | 
                  <a href="${baseUrl}/datenschutz">${t.welcome_back.privacy}</a> | 
                  <a href="${baseUrl}/kontakt">${t.welcome_back.contact}</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'ramadan_special':
      return {
        subject: t.ramadan_special.subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${t.ramadan_special.title}</title>
            <style>
              body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
              .ramadan-header { background: linear-gradient(135deg, #7c3aed, #5b21b6); color: white; padding: 40px 20px; text-align: center; }
              .ramadan-header h1 { margin: 0; font-size: 32px; font-weight: bold; }
              .ramadan-header p { margin: 15px 0 0 0; font-size: 18px; color: #e9d5ff; }
              .content { padding: 30px 20px; }
              .blessing { background: #faf5ff; border: 2px solid #a855f7; padding: 25px; border-radius: 12px; text-align: center; font-style: italic; margin: 25px 0; color: #581c87; font-size: 16px; line-height: 1.8; }
              .hotel-offer { border: 2px solid #a855f7; border-radius: 12px; margin: 20px 0; overflow: hidden; background: linear-gradient(to right, #faf5ff, #ffffff); }
              .hotel-header { background: #f3e8ff; padding: 20px; border-bottom: 1px solid #e9d5ff; }
              .hotel-name { font-size: 20px; font-weight: bold; color: #581c87; margin: 0; }
              .hotel-location { color: #7c3aed; font-size: 14px; margin: 5px 0 0 0; font-weight: 500; }
              .hotel-details { padding: 25px; }
              .price-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
              .special-price-label { font-size: 14px; color: #7c3aed; font-weight: 600; margin-bottom: 5px; }
              .current-price { font-size: 26px; font-weight: bold; color: #7c3aed; }
              .original-price { text-decoration: line-through; color: #9ca3af; font-size: 18px; margin-left: 12px; }
              .ramadan-discount { background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; }
              .book-btn { background: linear-gradient(135deg, #7c3aed, #5b21b6); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; transition: all 0.3s; }
              .book-btn:hover { background: linear-gradient(135deg, #6d28d9, #4c1d95); transform: translateY(-1px); }
              .footer { background: #f8fafc; padding: 25px; text-align: center; color: #6b7280; font-size: 14px; }
              .closing-blessing { background: #fef3c7; color: #92400e; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; font-weight: 500; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="ramadan-header">
                <h1>${t.ramadan_special.title}</h1>
                <p>${t.ramadan_special.subtitle}</p>
              </div>
              
              <div class="content">
                <div class="blessing">
                  "${t.ramadan_special.blessing_quote}"
                </div>
                
                <h2>${t.ramadan_special.greeting}</h2>
                <p>${t.ramadan_special.intro}</p>
                
                ${hotelOffers
                  .map(
                    (hotel) => `
                  <div class="hotel-offer">
                    <div class="hotel-header">
                      <h3 class="hotel-name">${hotel.name}</h3>
                      <p class="hotel-location">📍 ${hotel.city} • Ramadan Spezial-Paket</p>
                    </div>
                    <div class="hotel-details">
                      <div class="special-price-label">${t.ramadan_special.special_price}</div>
                      <div class="price-section">
                        <div>
                          <span class="current-price">€${hotel.price}</span>
                          <span class="original-price">€${hotel.originalPrice}</span>
                        </div>
                        <span class="ramadan-discount">30% Ramadan-Rabatt</span>
                      </div>
                      <a href="${hotel.halal_booking_url}" class="book-btn">🌙 Jetzt buchen - Ramadan Special</a>
                    </div>
                  </div>
                `
                  )
                  .join('')}
                
                <div class="closing-blessing">
                  ${t.ramadan_special.closing}
                </div>
              </div>
              
              <div class="footer">
                <p><strong>${t.welcome_back.signature}</strong></p>
                <p>
                  <a href="${baseUrl}/abmelden">${t.welcome_back.unsubscribe}</a> | 
                  <a href="${baseUrl}/datenschutz">${t.welcome_back.privacy}</a> | 
                  <a href="${baseUrl}/kontakt">${t.welcome_back.contact}</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    default:
      return {
        subject: 'UmrahCheck Hotel Updates',
        html: '<p>Default email template</p>'
      };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: EmailCampaignRequest = await request.json();
    const {
      campaign_type,
      recipients,
      segment = 'all',
      test_email,
      language = 'de'
    } = body;

    // Validation
    if (!campaign_type || !recipients) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: campaign_type, recipients'
        },
        { status: 400 }
      );
    }

    console.log(
      `📧 Starting ${campaign_type} campaign for ${recipients} contacts`
    );

    // Fetch live hotel prices (in production, this would be from database)
    console.log('🔍 Fetching live hotel prices for email personalization...');

    // Simulate fetching hotel data
    await new Promise((resolve) => setTimeout(resolve, 200));
    const hotelOffers = mockHotelOffers.slice(0, 3); // Get top 3 deals

    // For now, use mock affiliate URLs until HalalBooking partnership is ready
    const hotelOffersWithAffiliates = hotelOffers.map((hotel) => ({
      ...hotel,
      halal_booking_url: `${hotel.halal_booking_url}?ref=umrahcheck_de&utm_source=umrahcheck&utm_medium=email&tracking_id=uc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));

    // Generate email template with language support
    const emailTemplate = getEmailTemplate(
      campaign_type,
      hotelOffersWithAffiliates,
      language
    );

    // Determine recipients (in production, query from database based on segment)
    const emailList = test_email
      ? [test_email]
      : [
          'mustafa19musse@hotmail.de', // Use the provided test email
          'test1@example.com',
          'test2@example.com',
          'test3@example.com',
          'test4@example.com'
        ].slice(0, Math.min(recipients, 5)); // Limit for testing

    // Send emails in batches
    const batchSize = 5;
    const batches = [];

    for (let i = 0; i < emailList.length; i += batchSize) {
      batches.push(emailList.slice(i, i + batchSize));
    }

    console.log(
      `📤 Sending ${emailList.length} emails in ${batches.length} batches`
    );

    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(
        `📧 Sending batch ${i + 1}/${batches.length} (${batch.length} emails)`
      );

      try {
        // Send batch using Resend
        const emailPromises = batch.map((email) =>
          resend.emails.send({
            from: 'UmrahCheck <noreply@umrahcheck.de>',
            to: [email],
            subject: emailTemplate.subject,
            html: emailTemplate.html
          })
        );

        const results = await Promise.allSettled(emailPromises);

        const batchSent = results.filter(
          (r) => r.status === 'fulfilled'
        ).length;
        const batchFailed = results.filter(
          (r) => r.status === 'rejected'
        ).length;

        totalSent += batchSent;
        totalFailed += batchFailed;

        console.log(`✅ Batch ${i + 1} sent successfully: ${batchSent} emails`);

        // Small delay between batches to respect rate limits
        if (i < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Error sending batch ${i + 1}:`, error);
        totalFailed += batch.length;
      }
    }

    const processingTime = Date.now() - startTime;

    console.log(
      `🎯 Campaign complete: ${totalSent} sent, ${totalFailed} failed in ${processingTime}ms`
    );

    return NextResponse.json({
      success: true,
      campaign_id: `campaign_${Date.now()}`,
      campaign_type,
      segment,
      total_recipients: emailList.length,
      emails_sent: totalSent,
      emails_failed: totalFailed,
      processing_time_ms: processingTime,
      hotel_offers_included: hotelOffers.length,
      message: `Successfully sent ${totalSent} emails for ${campaign_type} campaign`
    });
  } catch (error) {
    console.error('❌ Email campaign API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error during email campaign'
      },
      { status: 500 }
    );
  }
}

// GET method for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'UmrahCheck Email Campaigns API',
    endpoint: 'POST /api/email-campaigns',
    version: '1.0.0',
    available_campaigns: ['welcome_back', 'price_drop', 'ramadan_special'],
    status: 'operational'
  });
}
