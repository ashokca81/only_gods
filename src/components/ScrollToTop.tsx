"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const ScrollToTop = () => {
    const pathname = usePathname();

    useEffect(() => {
        // Disable browser's default scroll restoration to ensure top on refresh
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        // Scroll to top on mount (refresh) and on route change
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
