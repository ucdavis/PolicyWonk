import React from 'react';

import { Variants, motion } from 'framer-motion';

interface AnimatedButtonProps {
  disabled?: boolean;
  displayBeforeClick: React.ReactNode;
  displayAfterClick?: React.ReactNode;
  onClick: () => void;
  clearOnHover?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  disabled,
  displayBeforeClick,
  displayAfterClick,
  onClick,
  clearOnHover = false,
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
      color: 'var(--secondary-color)',
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
      whileHover={disabled ? ['disabled', 'hover'] : 'hover'}
      whileTap={disabled ? ['disabled', 'tap'] : 'tap'}
      disabled={disabled}
      onTapStart={() => setIsTapped(true)}
      onTap={() => setIsTapped(false)}
      onTapCancel={() => setIsTapped(false)}
    >
      {(hasClicked || isTapped) && !!displayAfterClick
        ? displayAfterClick
        : displayBeforeClick}
    </motion.button>
  );
};

export default AnimatedButton;
