import React from 'react';

import {
  FontAwesomeIcon,
  FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';

import VisuallyHidden from './visuallyHidden';

type AggieIconProps = (
  | { isDecorative: true; label?: never }
  | { isDecorative?: false; label: string }
) &
  FontAwesomeIconProps;
/**
 * AggieIcon is a wrapper around FontAwesomeIcon that adds support for a11y labels.
 * If the icon is purely decorative, pass `isDecorative: true`, and no label is needed.
 * An icon is purely decorative if it doesn't convey any information that isn't already present.
 * For example, an icon within a button should be purely decorative–the button should have the appropriate properties.
 * If the icon conveys information without nearby text, pass a label and `isDecorative: false`.
 */
const AggieIcon: React.FC<AggieIconProps> = ({
  label,
  isDecorative,
  ...deferred
}) => {
  const id = React.useId();
  return (
    <>
      <FontAwesomeIcon
        {...deferred}
        aria-hidden={isDecorative}
        aria-labelledby={!isDecorative ? id : undefined}
      />
      {label && !isDecorative && (
        <VisuallyHidden id={id}>{label}</VisuallyHidden>
      )}
    </>
  );
};

export default AggieIcon;
