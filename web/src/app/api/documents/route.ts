import { ClientOptions, Client } from '@elastic/elasticsearch';
import { MongoClient } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

import { PolicyIndex } from '../../../models/chat';

// we don't want to pre-build this route
export const dynamic = 'force-dynamic';

// get my vector store
const config: ClientOptions = {
  node: process.env.ELASTIC_URL ?? 'http://127.0.0.1:9200',
  auth: {
    username: process.env.ELASTIC_SEARCHER_USERNAME ?? 'elastic',
    password: process.env.ELASTIC_SEARCHER_PASSWORD ?? 'changeme',
  },
};

const searchClient: Client = new Client(config);

const indexName = process.env.ELASTIC_INDEX ?? 'test_vectorstore4';

const mongoConnectionString = process.env.MONGO_CONNECTION ?? '';
const mongoDbName = process.env.MONGO_DB ?? 'policywonk';
const exportApiKey = process.env.EXPORT_API_KEY;

// TODO: move this to a shared utility
type WonkDocuments = {
  last_updated: string;
  url: string;
  title: string;
  metadata: Record<string, any>;
};

export async function GET(request: NextRequest) {
  const _mongoClient = new MongoClient(mongoConnectionString);
  try {
    const documentCollection = _mongoClient
      .db(mongoDbName)
      .collection<WonkDocuments>('documents');

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

    // Build Mongo filter
    const filter: Record<string, any> = {};
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
      // If 'since' is provided, only get documents where last_updated >= since
      filter.last_updated = { $gte: sinceDate };
    }

    // only query for docs with UCOP or UCDPOLICY scope
    filter['metadata.scope'] = { $in: ['UCOP', 'UCDPOLICY'] };

    // -- Query MongoDB for the total count (for pagination) --
    const total = await documentCollection.countDocuments(filter);

    // -- Query MongoDB for paginated documents --
    const mongoDocs = await documentCollection
      .find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    // If no documents found, return an empty result set.
    if (mongoDocs.length === 0) {
      return NextResponse.json({
        page,
        page_size: pageSize,
        total,
        results: [],
      });
    }

    // Collect all URLs from this page of documents
    const urls = mongoDocs.map((doc) => doc.url);

    // -- Query Elasticsearch to get all docs matching these URLs --
    // If you have multiple indexes or different naming, adjust accordingly.
    // Also note that if you expect a large number of matches, you may want to
    // scroll or paginate your ES query, or set a sufficiently high `size`.
    const esSize = 10000; // example size; adjust if you expect more than 10k
    const esQueryBody = {
      query: {
        bool: {
          filter: [{ terms: { 'metadata.url.keyword': urls } }],
        },
      },
      // Sort by metadata.start_index so we can easily concatenate in order
      sort: [{ 'metadata.start_index': { order: 'asc' } }],
      size: esSize,
    };

    const esResponse = await searchClient.search<PolicyIndex>({
      index: indexName,
      ...esQueryBody,
    });

    const hits = esResponse.hits?.hits || [];

    // -- Group Elasticsearch docs by their metadata.url --
    const groupedByUrl: Record<string, { text: string; metadata: any }[]> = {};
    for (const hit of hits) {
      const src = hit._source;

      if (!src || !src.metadata || !src.metadata.url) {
        continue;
      }

      const docUrl = src.metadata.url;
      if (!docUrl) {
        continue;
      }
      if (!groupedByUrl[docUrl]) {
        groupedByUrl[docUrl] = [];
      }
      groupedByUrl[docUrl].push({
        text: src.text || '',
        metadata: src.metadata || {},
      });
    }

    // At this point, each groupedByUrl[url] is already sorted (due to ES sort)
    // but to be sure, we can sort by metadata.start_index again:
    for (const urlKey of Object.keys(groupedByUrl)) {
      groupedByUrl[urlKey].sort((a, b) => {
        const aIndex = a.metadata.start_index || 0;
        const bIndex = b.metadata.start_index || 0;
        return aIndex - bIndex;
      });
    }

    // -- Map our Mongo docs and inject concatenated text from Elasticsearch --
    const finalDocs = mongoDocs.map((doc) => {
      const docUrl = doc.url;
      // If we have ES hits for this URL, concatenate their text
      const esChunks = groupedByUrl[docUrl] || [];
      const concatenatedText = esChunks.map((chunk) => chunk.text).join('\n');

      // Create a return shape that matches the OpenAPI Document schema
      // We'll call our Mongo field "last_updated" => "last_modified" if you like:
      return {
        url: doc.url,
        content: concatenatedText,
        title: doc.title || '',
        doc_type: '',
        description: '',
        site_name: '', // might want to pull from metadata.scope or source.name?
        last_modified: doc.last_updated,
        metadata: doc.metadata || {},
      };
    });

    // -- Return the final result in the expected JSON format --
    return NextResponse.json({
      page,
      page_size: pageSize,
      total,
      results: finalDocs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await _mongoClient.close();
  }
}
