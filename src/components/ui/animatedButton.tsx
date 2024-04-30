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
  displayBeforeClick,
  displayOnClick,
  onClick,
  disabled = false,
  clearOnHover = false,
  selected = false,
}) => {
  const [hasClicked, setHasClicked] = React.useState<boolean>(selected);
  const [isTapped, setIsTapped] = React.useState<boolean>(false);
  const [isHovered, setIsHovered] = React.useState<boolean>(false);

  const handleClick = () => {
    if (disabled) return;
    setHasClicked(true);
    onClick();
  };

  const handleHover = (hovered: boolean) => {
    if (clearOnHover && hovered) {
      clear();
    }
    setIsHovered(hovered);
  };

  const handleTap = (tapped: boolean) => {
    if (disabled) return;
    setIsTapped(tapped);
  };

  const clear = () => {
    setHasClicked(false);
    setIsTapped(false);
  };

  const defaultVariants: Variants = {
    selected: {
      scale: 1.2,
      opacity: 1,
      color: 'var(--primary-color)',
    },
    hover: {
      scale: 1.2,
      transition: { type: 'spring', stiffness: 400, damping: 10 },
      color: 'var(--secondary-color)',
    },
    disabledHover: {
      opacity: 0.5,
    },
    tap: {
      scale: 0.8,
      color: 'var(--primary-color)',
    },
  };
  return (
    <motion.button
      className='btn-feedback me-1'
      onClick={handleClick}
      onMouseEnter={() => handleHover(true)}
      onHoverEnd={() => handleHover(false)}
      variants={defaultVariants}
      whileHover={isHovered ? 'hover' : 'disabledHover'}
      whileTap={isTapped ? 'tap' : {}}
      disabled={disabled}
      onTapStart={() => handleTap(true)}
      onTap={() => handleTap(false)}
      onTapCancel={() => handleTap(false)}
      initial={false}
      animate={selected ? 'selected' : {}}
    >
      {(isTapped || hasClicked || selected) && !!displayOnClick
        ? displayOnClick
        : displayBeforeClick}
    </motion.button>
  );
};

export default AnimatedButton;
