import { Variants } from 'framer-motion';

const animationColors = {
  primary: 'var(--primary-color)',
  secondary: 'var(--secondary-color)',
  tertiary: 'var(--tertiary-color)',
};

export const defaultVariants: Variants = {
  selected: {
    scale: 1.2,
    opacity: 1,
    color: animationColors.primary,
  },
  hover: {
    scale: 1.2,
    transition: { type: 'spring', stiffness: 400, damping: 10 },
    color: animationColors.secondary,
  },
  disabledHover: {
    opacity: 0.5,
  },
  tap: {
    scale: 0.8,
    color: animationColors.primary,
  },
};
