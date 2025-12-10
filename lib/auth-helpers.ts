import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export type AuthenticatedUser = {
  type: "user";
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

export type GuestUser = {
  type: "guest";
  id: string;
  name: string | null;
};

export type CurrentUser = AuthenticatedUser | GuestUser;

export type AuthResult =
  | { ok: true; user: CurrentUser }
  | { ok: false; error: string; status: 401 | 403 | 404 };

export type AuthenticatedResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; error: string; status: 401 | 403 | 404 };

/**
 * Obtiene el usuario actual (autenticado o guest)
 *
 * Uso:
 * ```ts
 * const auth = await getCurrentUser(req);
 * if (!auth.ok) {
 *   return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
 * }
 * const { user } = auth;
 * // user.type === "user" | "guest"
 * // user.id siempre disponible
 * ```
 */
export async function getCurrentUser(req: NextRequest): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  // Usuario autenticado
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true, image: true },
    });

    if (!user || !user.email) {
      return { ok: false, error: "Usuario no encontrado", status: 404 };
    }

    return {
      ok: true,
      user: {
        type: "user" as const,
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    };
  }

  // Guest (invitado)
  const guestId = req.cookies.get("guestId")?.value;
  if (guestId) {
    // Buscar nombre del guest en participantes (si existe)
    const participant = await prisma.participant.findFirst({
      where: { guestId },
      select: { name: true },
    });

    return {
      ok: true,
      user: {
        type: "guest" as const,
        id: guestId,
        name: participant?.name || null,
      },
    };
  }

  return { ok: false, error: "No autenticado", status: 401 };
}

/**
 * Obtiene solo usuarios autenticados (no guests)
 * Útil para endpoints que requieren cuenta registrada
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { ok: false, error: "No autenticado", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, image: true },
  });

  if (!user || !user.email) {
    return { ok: false, error: "Usuario no encontrado", status: 404 };
  }

  return {
    ok: true,
    user: {
      type: "user" as const,
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
  };
}

/**
 * Helper para extraer userId/guestId del CurrentUser
 */
export function getUserIds(user: CurrentUser): { userId?: string; guestId?: string } {
  if (user.type === "user") {
    return { userId: user.id };
  }
  return { guestId: user.id };
}
