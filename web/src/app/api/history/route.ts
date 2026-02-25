import { NextRequest, NextResponse } from 'next/server';

import { isWonkSuccess } from '@/lib/error/error';
import { isValidGroupName } from '@/lib/groups';
import { getChatHistoryForGroup } from '@/services/historyService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const group = searchParams.get('group');

  if (!group || !isValidGroupName(group)) {
    return NextResponse.json({ error: 'Invalid group' }, { status: 400 });
  }

  const result = await getChatHistoryForGroup(group);

  if (!isWonkSuccess(result)) {
    return NextResponse.json(
      { error: 'Unable to load history' },
      { status: Number(result.status) }
    );
  }

  return NextResponse.json({ chats: result.data });
}
