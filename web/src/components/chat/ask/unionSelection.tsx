'use client';
import React from 'react';

import { FocusName, Union, getUnionDescription } from '@/models/focus';

interface UnionSelectionProps {
  group: string;
  onSelection: (type: FocusName, subFocus: string, description: string) => void;
}

const UnionSelection: React.FC<UnionSelectionProps> = ({
  group,
  onSelection,
}) => {
  const [unions, setUnions] = React.useState<Union[]>();
  const [error, setError] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/unions?group=${encodeURIComponent(group)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Catalog unavailable');
        }
        const result = await response.json();
        if (!Array.isArray(result.unions)) {
          throw new Error('Invalid catalog');
        }
        if (!controller.signal.aborted) {
          setUnions(result.unions);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(true);
        }
      });
    return () => controller.abort();
  }, [group, attempt]);

  return (
    <div>
      <h2 className='text-lg font-semibold'>Union selection</h2>
      {error ? (
        <div className='alert alert-error mt-4' role='alert'>
          <div>
            <p>
              Union contracts are temporarily unavailable. Your focus has not
              changed.
            </p>
            <button
              type='button'
              className='btn btn-link px-0 text-error-content underline'
              onClick={() => {
                setError(false);
                setUnions(undefined);
                setAttempt((value) => value + 1);
              }}
            >
              Try again
            </button>
          </div>
        </div>
      ) : unions === undefined ? (
        <p className='mt-4' role='status'>
          Loading union contracts…
        </p>
      ) : unions.length === 0 ? (
        <p className='mt-4'>
          No searchable union contracts are available for this campus.
        </p>
      ) : (
        <div className='mt-4 space-y-2'>
          {unions.map((union) => (
            <button
              type='button'
              key={union.key}
              className='block w-full rounded-box border border-main-border bg-base-100 px-4 py-3 text-left hover:border-primary hover:bg-primary/5'
              onClick={() =>
                onSelection('unions', union.key, getUnionDescription(union))
              }
            >
              {union.value} - {union.key.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnionSelection;
