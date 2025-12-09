import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const headers = response.headers;

    // 1. DNS Prefetch Control
    // Reduce latency for external links but maintains privacy
    headers.set("X-DNS-Prefetch-Control", "on");

    // 2. Strict Transport Security (HSTS)
    // Force HTTPS for 2 years (recommended for production)
    headers.set(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload"
    );

    // 3. X-Frame-Options
    // Prevent clickjacking by not allowing the site to be embedded in frames/iframes
    headers.set("X-Frame-Options", "SAMEORIGIN");

    // 4. X-Content-Type-Options
    // Prevent MIME type sniffing
    headers.set("X-Content-Type-Options", "nosniff");

    // 5. Referrer Policy
    // Control how much referrer information is sent
    headers.set("Referrer-Policy", "origin-when-cross-origin");

    // 6. Permissions Policy
    // Allow Geolocation and Camera (needed for challenges) but restrict others
    // Note: wildcard '*' is often required for mobile browsers/webviews interactions
    headers.set(
        "Permissions-Policy",
        "camera=*, geolocation=*, microphone=(), payment=(), usb=()"
    );

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - robots.txt
         * - sitemap.xml
         */
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    ],
};
