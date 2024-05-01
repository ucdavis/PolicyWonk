import React from 'react';

import { Focus, FocusName } from '@/models/focus';

interface UnionSelectionProps {
  focus: Focus;
  onSelection: (type: FocusName, subFocus: string) => void;
}

const UnionSelection: React.FC<UnionSelectionProps> = ({ onSelection }) => {
  const unionSelected = (union: string) => {
    onSelection('unions', union);
  };

  return (
    <div className='container'>
      <h1>Union Selection</h1>
      <div className='list-group'>
        {unions.map((union) => (
          <a
            key={union.key}
            href='#'
            className='list-group-item list-group-item-action'
            onClick={() => unionSelected(union.key)}
          >
            {union.value}
          </a>
        ))}
      </div>
    </div>
  );
};

type KeyValuePair = {
  key: string;
  value: string;
};

// TODO: grab unions from the db/index somehow? or just hardcode them?
const unions: KeyValuePair[] = [
  { key: 'bx', value: 'Academic Student Employees' },
  { key: 'cx', value: 'Clerical & Allied Services' },
  { key: 'br', value: 'Graduate Student Researchers' },
  { key: 'hx', value: 'Health Care Professionals' },
  { key: 'ix', value: 'Non-Senate Instructional (Lecturers)' },
  { key: 'ex', value: 'Patient Care Technical' },
  { key: 'dx', value: 'Physicians, Dentists and Podiatrists' },
  { key: 'pa', value: 'Police Officers' },
  { key: 'px', value: 'Postdoctoral Scholars' },
  { key: 'lx', value: 'Professional Librarians' },
  { key: 'nx', value: 'Registered Nurses' },
  { key: 'rx', value: 'Research Support Professionals' },
  { key: 'sx', value: 'Service' },
  { key: 'tx', value: 'Technical' },
  { key: 'kb', value: 'Skilled Craft' },
  { key: 'gs', value: 'Printing Trades' },
];

export default UnionSelection;
