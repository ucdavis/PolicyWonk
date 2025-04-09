import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/db';

// we don't want to pre-build this route
export const dynamic = 'force-dynamic';

const exportApiKey = process.env.EXPORT_API_KEY;

export async function GET(request: NextRequest) {
  try {
    // -- Simple API key check (matching ApiKeyAuth in your OpenAPI spec) --
    const apiKey = request.headers.get('X-API-Key');

    if (!apiKey || apiKey !== exportApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized (invalid or missing API key)' },
        { status: 401 }
      );
    }

    // -- Parse query params --
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '10', 10);
    const maxPageSize = 100;

    if (Number.isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "Invalid 'page' parameter. Must be a positive integer." },
        { status: 400 }
      );
    }

    if (Number.isNaN(pageSize) || pageSize < 1 || pageSize > maxPageSize) {
      return NextResponse.json(
        {
          error: `Invalid 'page_size' parameter. Must be between 1 and ${maxPageSize}.`,
        },
        { status: 400 }
      );
    }
    const since = searchParams.get('since'); // date-time string (optional)

    // Build the Prisma query filter for documents.
    const prismaFilter: any = {
      OR: [
        { source: { type: 'UCOP' } },
        { source: { type: 'UCDPOLICYMANUAL' } },
      ],
    };

    if (since) {
      const sinceDate = new Date(since);
      if (Number.isNaN(sinceDate.getTime())) {
        return NextResponse.json(
          {
            error:
              "Invalid 'since' parameter. Must be a valid date-time string.",
          },
          { status: 400 }
        );
      }
      prismaFilter.last_updated = { gte: sinceDate };
    }

    // get pageSize docs with UCOP source and optinally filter by 'since'
    const docs = await prisma.documents.findMany({
      where: prismaFilter,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        url: 'asc',
      },
      include: {
        documentContents: true,
      },
    });

    // also get total count of documents
    const total = await prisma.documents.count({
      where: prismaFilter,
    });

    console.log('total:', total);

    // If no documents found, return an empty result set.
    if (docs.length === 0) {
      return NextResponse.json({
        page,
        page_size: pageSize,
        total,
        results: [],
      });
    }

    const docsInResponseFormat = docs.map((doc) => ({
      url: doc.url,
      content: doc.documentContents?.content,
      title: doc.title,
      doc_type: '',
      description: '',
      last_modified: doc.lastUpdated,
      metadata: doc.meta || {},
    }));

    // -- Return the final result in the expected JSON format --
    return NextResponse.json({
      page,
      page_size: pageSize,
      total,
      results: docsInResponseFormat,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
