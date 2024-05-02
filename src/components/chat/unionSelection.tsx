import React from 'react';

import { Focus, FocusName, Union, unions } from '@/models/focus';

interface UnionSelectionProps {
  focus: Focus;
  onSelection: (type: FocusName, subFocus: string, description: string) => void;
}

const UnionSelection: React.FC<UnionSelectionProps> = ({ onSelection }) => {
  const unionSelected = (union: Union) => {
    const description = `${union.value} (${union.key})`;
    onSelection('unions', union.key, description);
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
            onClick={() => unionSelected(union)}
          >
            {union.value}
          </a>
        ))}
      </div>
    </div>
  );
};

export default UnionSelection;
