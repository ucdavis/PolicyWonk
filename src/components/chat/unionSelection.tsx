import React from 'react';

import { Focus, FocusName, unions } from '@/models/focus';

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

export default UnionSelection;
