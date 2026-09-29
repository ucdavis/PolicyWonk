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
    <div className='container'>
      <h2 className='h4'>Union Selection</h2>
      {error ? (
        <div role='alert'>
          <p>
            Union contracts are temporarily unavailable. Your focus has not
            changed.
          </p>
          <button
            type='button'
            className='btn btn-link'
            onClick={() => {
              setError(false);
              setUnions(undefined);
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : unions === undefined ? (
        <p role='status'>Loading union contracts…</p>
      ) : unions.length === 0 ? (
        <p>No searchable union contracts are available for this campus.</p>
      ) : (
        <div className='list-group'>
          {unions.map((union) => (
            <button
              type='button'
              key={union.key}
              className='list-group-item list-group-item-action'
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
