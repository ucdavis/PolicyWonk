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
    <div className='container mt-5'>
      <div className='row justify-content-center'>
        <div className='col-md-8'>
          <div className='card'>
            <div className='card-header'>
              <h2 className='mb-0'>Select a location</h2>
            </div>
            <div className='card-body'>
              <p className='lead mb-4'>
                Choose which location you want to use for your PolicyWonk
                session:
              </p>

              <div className='list-group'>
                {campuses.map((campus) => (
                  <button
                    key={campus.value}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                      selectedGroup === campus.value ? 'active' : ''
                    }`}
                    onClick={() => handleGroupSelection(campus.value)}
                    disabled={isLoading}
                  >
                    <span>{campus.name}</span>
                    {isLoading && selectedGroup === campus.value && (
                      <div
                        className='spinner-border spinner-border-sm text-light'
                        role='status'
                      >
                        <span className='visually-hidden'>Loading...</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className='card-footer text-muted'>
              <small>
                Your selected location will determine which policies and
                procedures are most relevant to your queries.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
