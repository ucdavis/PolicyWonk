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
  animateOnChange?: any;
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
  animateOnChange = false,
  className = 'btn-feedback me-1',
  title,
  variants,
  ...rest
}) => {
  const [hasClicked, setHasClicked] = React.useState<boolean>(
    selected || animateOnEnter
  );
  const [isTapped, setIsTapped] = React.useState<boolean>(false);
  const [isHovered, setIsHovered] = React.useState<boolean>(false);
  const [scope, animate] = useAnimate();

  React.useEffect(() => {
    if (!animateOnEnter || !animateOnChange) return;

    const enterAnimation = async () => {
      const a: Variant = {
        scale: [
          null,
          1.2, // hover
          0.8, // tap
          1.2, // hover
          1.2, // selected
        ],
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

    enterAnimation();
  }, [animateOnEnter, scope, animate, animateOnChange]);

  const defaultVariants: Variants = {
    default: {
      ...variants?.default,
    },
    selected: {
      scale: 1.2,
      opacity: 1,
      color: 'var(--primary-color)',
      ...variants?.selected,
    },
    hover: {
      scale: 1.2,
      transition: { type: 'spring', stiffness: 400, damping: 10 },
      color: 'var(--secondary-color)',
      ...variants?.hover,
    },
    disabledHover: {
      opacity: 0.5,
      ...variants?.disabledHover,
    },
    tap: {
      scale: 0.8,
      color: 'var(--primary-color)',
      ...variants?.tap,
    },
  };

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
      animate={selected ? 'selected' : 'default'}
      {...rest}
    >
      {(isTapped || hasClicked || selected) && !!displayOnClick
        ? displayOnClick
        : displayBeforeClick}
    </motion.button>
  );
};

export default AnimatedButton;
