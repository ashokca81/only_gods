import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import BottomNav from '@/components/BottomNav';
import AuthModal from '@/components/AuthModal';
import ScrollToTop from '@/components/ScrollToTop';
import { UIProvider } from '@/buffer/UIContext';
import { QueryProvider } from './providers';
import { ThemeProvider } from '@/components/ThemeProvider';
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

export const metadata: Metadata = {
    title: 'ONLY GODS - Premium Fashion & Lifestyle',
    description: 'Exclusive pieces designed for the elite. Premium quality, limited editions.',
    keywords: ['fashion', 'luxury', 'premium', 'clothing', 'lifestyle'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${gillSans.variable}`} suppressHydrationWarning>
            <body className="font-sans antialiased bg-white text-black dark:bg-black dark:text-white" suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem={false}
                >
                    <UIProvider>
                        <QueryProvider>
                            <TooltipProvider>
                                <ScrollToTop />
                                <Toaster />
                                <Sonner />
                                {children}
                                <BottomNav />
                                <AuthModal />
                            </TooltipProvider>
                        </QueryProvider>
                    </UIProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
