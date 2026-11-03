import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import BottomNav from '@/components/BottomNav';
import AuthModal from '@/components/AuthModal';
import AbandonedCartSync from '@/components/AbandonedCartSync';
import ScrollToTop from '@/components/ScrollToTop';
import AnnouncementBar from '@/components/AnnouncementBar';
import { UIProvider } from '@/buffer/UIContext';
import { CartProvider } from '@/buffer/CartContext';
import { CustomerProvider } from '@/buffer/CustomerContext';
import { QueryProvider } from './providers';
import { ThemeProvider } from '@/components/ThemeProvider';
import ThemeScheduler from '@/components/ThemeScheduler';
import '@/index.css';

const gillSans = localFont({
    src: [
        {
            path: '../public/gill-sans-2/Gill Sans.otf',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../public/gill-sans-2/Gill Sans Italic.otf',
            weight: '400',
            style: 'italic',
        },
        {
            path: '../public/gill-sans-2/Gill Sans Medium.otf',
            weight: '500',
            style: 'normal',
        },
        {
            path: '../public/gill-sans-2/Gill Sans Medium Italic.otf',
            weight: '500',
            style: 'italic',
        },
        {
            path: '../public/gill-sans-2/Gill Sans Bold.otf',
            weight: '700',
            style: 'normal',
        },
        {
            path: '../public/gill-sans-2/Gill Sans Bold Italic.otf',
            weight: '700',
            style: 'italic',
        },
        {
            path: '../public/gill-sans-2/Gill Sans Heavy.otf',
            weight: '800',
            style: 'normal',
        },
        {
            path: '../public/gill-sans-2/Gill Sans Heavy Italic.otf',
            weight: '800',
            style: 'italic',
        },
        {
            path: '../public/gill-sans-2/Gill Sans Light.otf',
            weight: '300',
            style: 'normal',
        },
        {
            path: '../public/gill-sans-2/Gill Sans Light Italic.otf',
            weight: '300',
            style: 'italic',
        },
    ],
    variable: '--font-gill-sans',
    display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://theonlygods.com';
const SITE_NAME = 'ONLY GODS';
const SITE_TITLE = 'ONLY GODS - Premium Fashion & Lifestyle';
const SITE_DESC = 'Exclusive pieces designed for the elite. Premium quality, limited editions.';

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: SITE_TITLE,
    description: SITE_DESC,
    keywords: ['fashion', 'luxury', 'premium', 'clothing', 'lifestyle'],
    openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        title: SITE_TITLE,
        description: SITE_DESC,
        url: SITE_URL,
        images: [{ url: '/dark_logo.png', width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
        card: 'summary_large_image',
        title: SITE_TITLE,
        description: SITE_DESC,
        images: ['/dark_logo.png'],
    },
};

// A real phone (touch + small physical screen) whose browser claims to be a
// desktop (no "Mobile" in the user agent) = Chrome "Desktop site" mode.
// Pin the viewport to the phone's own width so the mobile design is used.
// Real computers, tablets and normal phone browsing are never touched.
const KEEP_MOBILE_VIEWPORT = `(function(){try{
var w=Math.min(screen.width,screen.height);
if(!(navigator.maxTouchPoints>0)||w>600||/Mobi/i.test(navigator.userAgent))return;
function apply(){var m=document.querySelector('meta[name="viewport"]');
if(!m){m=document.createElement('meta');m.name='viewport';document.head.appendChild(m);}
var c='width='+screen.width+', initial-scale=1';if(m.content!==c)m.content=c;}
apply();addEventListener('orientationchange',function(){setTimeout(apply,300);});new MutationObserver(apply).observe(document.head,{childList:true,subtree:true,attributes:true,attributeFilter:['content']});
}catch(e){}})();`;

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${gillSans.variable}`} suppressHydrationWarning>
            <head>
                {/* Phone in Chrome "Desktop site" mode: keep the mobile layout. */}
                <script dangerouslySetInnerHTML={{ __html: KEEP_MOBILE_VIEWPORT }} />
            </head>
            <body className="font-sans antialiased bg-white text-black dark:bg-black dark:text-white" suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem={false}
                >
                    <ThemeScheduler />
                    <UIProvider>
                        <QueryProvider>
                            <CartProvider>
                              <CustomerProvider>
                                <TooltipProvider>
                                    <ScrollToTop />
                                    <AnnouncementBar />
                                    <Toaster />
                                    <Sonner />
                                    {children}
                                    <BottomNav />
                                    <AuthModal />
                                    <AbandonedCartSync />
                                </TooltipProvider>
                              </CustomerProvider>
                            </CartProvider>
                        </QueryProvider>
                    </UIProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
