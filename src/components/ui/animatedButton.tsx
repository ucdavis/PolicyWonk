'use client';
import React from 'react';

import {
  HTMLMotionProps,
  Variant,
  Variants,
  motion,
  useAnimate,
} from 'framer-motion';

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  disabled?: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  displayBeforeClick: React.ReactNode;
  displayOnClick?: React.ReactNode;
  clearOnHover?: boolean;
  selected?: boolean;
  animateOnEnter?: boolean;
  className?: string;
  title?: string;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  displayBeforeClick,
  displayOnClick,
  onClick,
  disabled = false,
  clearOnHover = false,
  selected = false,
  animateOnEnter = false,
  className = 'btn-feedback me-1',
  title,
  ...rest
}) => {
  const [hasClicked, setHasClicked] = React.useState<boolean>(
    selected || animateOnEnter
  );
  const [isTapped, setIsTapped] = React.useState<boolean>(false);
  const [isHovered, setIsHovered] = React.useState<boolean>(false);
  const [scope, animate] = useAnimate();

  React.useEffect(() => {
    const enterAnimation = async () => {
      const a: Variant = {
        scale: [null, 1, 1.2, 0.8, 1.2], // hover, tap, selected
        color: [
          null,
          'var(--secondary-color)',
          'var(--primary-color)',
          'var(--secondary-color)',
          'var(--primary-color)',
        ],
      };
      await animate(scope.current, a);
    };
    if (animateOnEnter) {
      enterAnimation();
    }
  }, [animateOnEnter, scope, animate]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
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
      // transition: { type: 'spring', stiffness: 400, damping: 10, duration: 1 },
    },
  };

  return (
    <motion.button
      ref={scope}
      className={className}
      title={title}
      onClick={handleClick}
      onMouseEnter={(e) => handleHover(e, true)}
      onHoverEnd={(event) => handleHover(event, false)}
      variants={defaultVariants}
      whileHover={isHovered ? 'hover' : 'disabledHover'}
      whileTap={isTapped ? 'tap' : {}}
      disabled={disabled}
      onTapStart={() => handleTap(true)}
      onTap={() => handleTap(false)}
      onTapCancel={() => handleTap(false)}
      initial={animateOnEnter ? true : false}
      animate={selected ? 'selected' : {}}
      {...rest}
    >
      {(isTapped || hasClicked || selected) && !!displayOnClick
        ? displayOnClick
        : displayBeforeClick}
    </motion.button>
  );
};

export default AnimatedButton;
