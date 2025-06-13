'use client';

import { useState } from 'react';

import { updateCurrentGroup, reloadWithNewGroup } from '@/lib/client-cookies';

interface GroupSwitcherProps {
  currentGroup?: string;
  availableGroups: string[];
}

export function GroupSwitcher({
  currentGroup = 'ucdavis',
  availableGroups,
}: GroupSwitcherProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(currentGroup);

  const handleGroupChange = async () => {
    if (selectedGroup === currentGroup) {
      return;
    }

    setIsUpdating(true);
    try {
      const success = await updateCurrentGroup(selectedGroup);
      if (success) {
        reloadWithNewGroup();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className='group-switcher'>
      <div className='mb-3'>
        <label htmlFor='groupSelect' className='form-label'>
          Current Location:
        </label>
        <select
          id='groupSelect'
          className='form-select'
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          disabled={isUpdating}
        >
          {availableGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>
      <button
        type='button'
        className='btn btn-primary'
        onClick={handleGroupChange}
        disabled={isUpdating || selectedGroup === currentGroup}
      >
        {isUpdating ? 'Updating...' : 'Switch Group'}
      </button>
    </div>
  );
}
