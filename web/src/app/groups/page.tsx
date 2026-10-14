'use client';
import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { updateCurrentGroup } from '@/lib/client-cookies';
import { campuses } from '@/lib/constants';

export default function GroupsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');

  const handleGroupSelection = async (group: string) => {
    setSelectedGroup(group);
    setIsLoading(true);

    try {
      // Update the group cookie
      const success = await updateCurrentGroup(group);

      if (success) {
        // Redirect to the new chat page for the selected group
        router.push(`/${group}/chat/new`);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
    }
  };

  return (
    <div className='mx-auto w-full max-w-2xl px-4 py-12 md:px-8'>
      <div className='card border border-main-border bg-base-100 shadow-sm'>
        <div className='card-body gap-5'>
          <div>
            <h1 className='card-title text-2xl'>Select a location</h1>
            <p className='mt-2 text-base text-base-content/75'>
              Choose which location you want to use for your PolicyWonk session:
            </p>
          </div>
          <div className='space-y-2'>
            {campuses.map((campus) => (
              <button
                key={campus.value}
                className={`flex w-full items-center justify-between rounded-box border border-main-border px-4 py-3 text-left font-medium transition-colors hover:border-primary hover:bg-primary/5 ${
                  selectedGroup === campus.value
                    ? 'border-primary bg-primary/10'
                    : ''
                }`}
                onClick={() => handleGroupSelection(campus.value)}
                disabled={isLoading}
              >
                <span>{campus.name}</span>
                {isLoading && selectedGroup === campus.value && (
                  <span
                    className='loading loading-spinner loading-sm text-primary'
                    role='status'
                  >
                    <span className='sr-only'>Loading...</span>
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className='border-t border-main-border pt-4 text-sm text-base-content/70'>
            Your selected location will determine which policies and procedures
            are most relevant to your queries.
          </div>
        </div>
      </div>
    </div>
  );
}
