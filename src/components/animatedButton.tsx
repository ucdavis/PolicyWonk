import React from 'react';

import { Variants, motion } from 'framer-motion';

interface AnimatedButtonProps {
  id?: string;
  disabled?: boolean;
  displayBeforeClick: React.ReactNode;
  displayAfterClick?: React.ReactNode;
  onClick: () => void;
  clearOnHover?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  id,
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
      // opacity: 0.5,
      color: ['var(--secondary-color)'],
    },
  };

  const handleClick = () => {
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
      id={id}
      className='btn-feedback me-1'
      onClick={handleClick}
      onMouseEnter={handleHover}
      variants={defaultVariants}
      whileHover='hover'
      whileTap='tap'
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
