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

// TODO: grab unions from the db? or just hardcode them?
const unions: KeyValuePair[] = [
  {
    key: 'AFSCME',
    value: 'American Federation of State, County and Municipal Employees',
  },
  {
    key: 'CNA',
    value: 'California Nurses Association',
  },
  {
    key: 'IBEW',
    value: 'International Brotherhood of Electrical Workers',
  },
  {
    key: 'UPTE',
    value: 'University Professional and Technical Employees',
  },
];

export default UnionSelection;
