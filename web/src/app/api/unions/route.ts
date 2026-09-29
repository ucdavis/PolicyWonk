import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { isValidGroupName } from '@/lib/groups';
import type { WonkSession } from '@/models/session';
import { getUnionCatalog } from '@/services/unionCatalog';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = (await auth()) as WonkSession;
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const group = request.nextUrl.searchParams.get('group');
  if (!group || !isValidGroupName(group)) {
    return NextResponse.json({ error: 'Invalid group' }, { status: 400 });
  }
  try {
    return NextResponse.json(
      { unions: await getUnionCatalog(group) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json(
      {
        error: 'Union contracts are temporarily unavailable. Please try again.',
      },
      { status: 503 }
    );
  }
}
