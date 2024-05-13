'use client';
import React from 'react';

import {
  AnimationScope,
  HTMLMotionProps,
  Variants,
  motion,
} from 'framer-motion';

export interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  displayBeforeClick: React.ReactNode;
  displayOnClick?: React.ReactNode;
  clearOnHover?: boolean;
  selected?: boolean;
  startClicked?: boolean;
  scope?: AnimationScope<any>;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  displayBeforeClick,
  displayOnClick,
  onClick,
  initial = false,
  disabled,
  clearOnHover,
  selected = false,
  className = 'btn-feedback me-1',
  title,
  ...deferred
}) => {
  const [hasClicked, setHasClicked] = React.useState<boolean>(selected);
  const [isTapped, setIsTapped] = React.useState<boolean>(false);
  const [isHovered, setIsHovered] = React.useState<boolean>(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }
    setHasClicked(true);
    onClick(e);
  };

  const handleHover = (
    e: React.MouseEvent<HTMLButtonElement> | MouseEvent,
    hovered: boolean
  ) => {
    if (clearOnHover && hovered) {
      clear();
    }
    setIsHovered(hovered);
  };

  const handleTap = (tapped: boolean) => {
    if (disabled) {
      return;
    }
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
      className={className}
      title={title}
      onClick={handleClick}
      onMouseEnter={(e) => handleHover(e, true)}
      onHoverEnd={(event) => handleHover(event, false)}
      variants={defaultVariants}
      whileHover={isHovered ? 'hover' : 'disabledHover'}
      whileTap={isTapped ? 'tap' : 'none'}
      disabled={disabled}
      onTapStart={() => handleTap(true)}
      onTap={() => handleTap(false)}
      onTapCancel={() => handleTap(false)}
      initial={initial}
      animate={selected ? 'selected' : 'none'}
      {...deferred}
    >
      {(isTapped || hasClicked || selected) && !!displayOnClick
        ? displayOnClick
        : displayBeforeClick}
    </motion.button>
  );
};

export default AnimatedButton;
