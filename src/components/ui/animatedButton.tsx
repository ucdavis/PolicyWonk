'use client';
import React from 'react';

import { HTMLMotionProps, motion } from 'framer-motion';

import { ButtonVariantOptions, ButtonVariants } from '@/models/animations';

export interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  displayBeforeClick: React.ReactNode;
  displayOnClick?: React.ReactNode;
  clearOnHover?: boolean;
  selected?: boolean;
  startClicked?: boolean;
  isLoading?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  displayBeforeClick,
  displayOnClick,
  onClick,
  initial = false,
  disabled,
  isLoading = false,
  clearOnHover,
  selected = false,
  className,
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

  return (
    <motion.button
      className={className ?? 'btn-feedback me-1'}
      title={title}
      onClick={handleClick}
      onMouseEnter={(e) => handleHover(e, true)}
      onHoverEnd={(event) => handleHover(event, false)}
      variants={ButtonVariants}
      whileHover={
        isHovered
          ? ButtonVariantOptions.hover
          : ButtonVariantOptions.disabledHover
      }
      whileTap={isTapped ? ButtonVariantOptions.tap : 'none'}
      disabled={disabled}
      onTapStart={() => handleTap(true)}
      onTap={() => handleTap(false)}
      onTapCancel={() => handleTap(false)}
      initial={initial}
      animate={selected ? ButtonVariantOptions.selected : 'none'}
      {...deferred}
    >
      {(isTapped || hasClicked || selected) && !!displayOnClick
        ? displayOnClick
        : displayBeforeClick}
    </motion.button>
  );
};

export default AnimatedButton;
