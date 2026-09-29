import type { estypes } from '@elastic/elasticsearch';
import { z } from 'zod';

import { searchClient, indexName } from '@/lib/elastic';
import { isValidGroupName } from '@/lib/groups';
import {
  getFocusesForGroup,
  getFocusWithSubFocus,
  type Union,
} from '@/models/focus';

const associationSchema = z.object({
  code: z
    .string()
    .regex(/^[A-Z0-9]+$/)
    .max(20),
  name: z.string().trim().min(1).max(300),
  campuses: z
    .array(
      z.enum([
        'all',
        'ucop',
        'ucdavis',
        'ucb',
        'ucsf',
        'uci',
        'ucla',
        'ucmerced',
        'ucr',
        'ucsd',
        'ucsb',
        'ucsc',
        'lbl',
      ])
    )
    .min(1),
});
export type UnitAssociation = z.infer<typeof associationSchema>;
export const CATALOG_TTL_MS = 5 * 60 * 1000;

type CatalogBucket = {
  document: {
    hits: {
      hits: {
        _source?: {
          metadata?: {
            bargaining_units?: unknown;
            keywords?: string[];
          };
        };
      }[];
    };
  };
};

// Aggregate document URLs only. Read association objects intact from _source:
// aggregating separate code/name/campus arrays would manufacture cross-products.
export async function loadIndexedUnits(): Promise<UnitAssociation[]> {
  const units: UnitAssociation[] = [];
  let after: Record<string, estypes.FieldValue> | undefined;
  const isV2 = indexName.includes('v2');
  do {
    const response = await searchClient.search({
      index: indexName,
      size: 0,
      allow_partial_search_results: false,
      query: {
        bool: {
          filter: [
            {
              term: {
                [isV2
                  ? 'metadata.source_type.keyword'
                  : 'metadata.scope.keyword']: isV2
                  ? 'UCCONTRACTS'
                  : 'UCCOLLECTIVEBARGAINING',
              },
            },
            { exists: { field: 'vector' } },
            { exists: { field: 'text' } },
            { exists: { field: 'metadata.bargaining_units.code' } },
          ],
        },
      },
      aggs: {
        documents: {
          composite: {
            size: 250,
            sources: [{ url: { terms: { field: 'metadata.url.keyword' } } }],
            ...(after ? { after } : {}),
          },
          aggs: {
            document: {
              top_hits: {
                size: 1,
                _source: ['metadata.bargaining_units', 'metadata.keywords'],
              },
            },
          },
        },
      },
    });
    if (response.timed_out || response._shards.failed) {
      throw new Error('Incomplete bargaining-unit catalog search');
    }
    const documents = response.aggregations?.documents as unknown as
      | {
          buckets: CatalogBucket[];
          after_key?: Record<string, estypes.FieldValue>;
        }
      | undefined;
    if (!documents || !Array.isArray(documents.buckets)) {
      throw new Error('Missing bargaining-unit catalog results');
    }
    for (const bucket of documents.buckets) {
      const metadata = bucket.document.hits.hits[0]?._source?.metadata;
      const associations = z
        .array(associationSchema)
        .min(1)
        .parse(metadata?.bargaining_units);
      for (const unit of associations) {
        // The existing retrieval filter still uses the uppercase code keyword.
        if (metadata?.keywords?.includes(unit.code)) {
          units.push(unit);
        }
      }
    }
    const next = documents.buckets.length ? documents.after_key : undefined;
    if (next && JSON.stringify(next) === JSON.stringify(after)) {
      throw new Error('Catalog pagination did not advance');
    }
    after = next;
  } while (after);
  return units;
}

export function createUnionCatalog(
  load: () => Promise<UnitAssociation[]>,
  now: () => number = () => Date.now()
) {
  let cached: { units: UnitAssociation[]; expires: number } | undefined;
  let pending: Promise<UnitAssociation[]> | undefined;
  return async (group: string): Promise<Union[]> => {
    if (!isValidGroupName(group)) {
      throw new Error('Invalid group');
    }
    if (!cached || now() >= cached.expires) {
      pending ??= load()
        .then((units) => {
          cached = { units, expires: now() + CATALOG_TTL_MS };
          return units;
        })
        .finally(() => {
          pending = undefined;
        });
      await pending; // Fail explicitly; never silently use an expired catalog.
    }
    const visible = new Map<string, Union>();
    for (const unit of cached!.units) {
      if (
        unit.campuses.includes('all') ||
        unit.campuses.some((campus) => campus === group)
      ) {
        const key = unit.code.toLowerCase();
        if (!visible.has(key)) {
          visible.set(key, { key, value: unit.name });
        }
      }
    }
    return [...visible.values()].sort(
      (a, b) => a.value.localeCompare(b.value) || a.key.localeCompare(b.key)
    );
  };
}

export const getUnionCatalog = createUnionCatalog(loadIndexedUnits);

export class FocusSelectionError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

// Both URL initialization and chat submission use the same catalog as the UI.
export async function resolveFocus(
  group: string,
  focus?: string,
  subFocus?: string
) {
  const options = getFocusesForGroup(group);
  if (focus === 'unions') {
    if (typeof subFocus !== 'string' || !/^[a-z0-9]+$/i.test(subFocus)) {
      throw new FocusSelectionError(
        'Choose a bargaining unit before asking your question.',
        400
      );
    }
    let catalog: Union[];
    try {
      catalog = await getUnionCatalog(group);
    } catch {
      throw new FocusSelectionError(
        'Union contracts are temporarily unavailable. Please try again.',
        503
      );
    }
    const selected = getFocusWithSubFocus(focus, subFocus, catalog);
    if (!selected) {
      throw new FocusSelectionError(
        'This bargaining unit is unavailable for this campus. Choose another focus.',
        400
      );
    }
    return selected;
  }
  const selected = getFocusWithSubFocus(focus, subFocus);
  return selected && options.some((option) => option.name === selected.name)
    ? selected
    : options[0];
}
