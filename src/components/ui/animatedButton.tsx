'use client';
import React from 'react';

import { Variants, motion } from 'framer-motion';

interface AnimatedButtonProps {
  disabled?: boolean;
  displayBeforeClick: React.ReactNode;
  displayOnClick?: React.ReactNode;
  onClick: () => void;
  clearOnHover?: boolean;
  selected?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  disabled,
  displayBeforeClick,
  displayOnClick,
  onClick,
  clearOnHover = false,
  selected = false,
}) => {
  const [hasClicked, setHasClicked] = React.useState<boolean>(false);
  const [isTapped, setIsTapped] = React.useState<boolean>(false);

  const defaultVariants: Variants = {
    hover: {
      scale: 1.2,
      transition: { type: 'spring', stiffness: 400, damping: 10 },
      color: 'var(--secondary-color)',
    },
    disabled: {
      opacity: 0.5,
      transition: { type: 'spring', stiffness: 600, damping: 30 },
    },
    tap: {
      scale: 0.8,
      color: 'var(--primary-color)',
    },
    selected: {
      scale: 1.2,
      color: 'var(--secondary-color)',
    },
  };

  const handleClick = () => {
    if (disabled) return;
    setHasClicked(true);
    onClick();
  };

  const handleHover = () => {
    if (clearOnHover) {
      clear();
    }
  };

  const handleTap = (isTapped: boolean) => {
    if (disabled) return;
    setIsTapped(isTapped);
  };

  const clear = () => {
    setHasClicked(false);
    setIsTapped(false);
  };

  return (
    <motion.button
      className='btn-feedback me-1'
      onClick={handleClick}
      onMouseEnter={handleHover}
      variants={defaultVariants}
      whileHover={disabled ? ['hover', 'disabled'] : 'hover'}
      whileTap={disabled ? ['tap', 'disabled'] : 'tap'}
      disabled={disabled}
      onTapStart={() => handleTap(true)}
      onTap={() => handleTap(false)}
      onTapCancel={() => handleTap(false)}
      animate={
        selected
          ? disabled
            ? ['selected', 'disabled']
            : 'selected'
          : 'default'
      }
    >
      {(isTapped || hasClicked) && !!displayOnClick
        ? displayOnClick
        : displayBeforeClick}
    </motion.button>
  );
};

export default AnimatedButton;
