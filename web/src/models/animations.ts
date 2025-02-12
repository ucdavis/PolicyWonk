import { Variant } from 'framer-motion';

const animationColors = {
  primary: 'var(--primary-color)',
  secondary: 'var(--secondary-color)',
  tertiary: 'var(--tertiary-color)',
};

export enum ButtonVariantOptions {
  selected = 'selected',
  hover = 'hover',
  disabledHover = 'disabledHover',
  tap = 'tap',
}

export const ButtonVariants: Record<ButtonVariantOptions, Variant> = {
  selected: {
    scale: 1.2,
    opacity: 1,
    color: animationColors.secondary,
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
    color: animationColors.secondary,
  },
};

export enum IconVariantOptions {
  rotate = 'rotate',
  rotateStop = 'rotateStop',
  bounce = 'bounce',
  bounceStop = 'bounceStop',
}

export const IconVariants: Record<IconVariantOptions, Variant> = {
  rotate: {
    rotate: [0, 360],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  rotateStop: { rotate: 360, transition: { repeat: 0, duration: 1 } },
  bounce: {
    y: [0, -10, 0],
    scale: 1,
    transition: {
      duration: 0.75,
      repeat: Infinity,
      stiffness: 90,
      damping: 5,
    },
  },
  bounceStop: { y: 0, transition: { repeat: 0 } },
};
