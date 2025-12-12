import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
    const auth = await getAuthenticatedUser(req);
    if (!auth.ok || !auth.user.email) {
        return NextResponse.json({ isAdmin: false });
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    const isAdmin = adminEmails.includes(auth.user.email);

    return NextResponse.json({ isAdmin });
}
