import { motion } from 'framer-motion';

import { IconVariantOptions, IconVariants } from '@/models/animations';

interface AnimatedIconProps {
  isAnimating: boolean;
  children: React.ReactNode;
}

export const AnimatedBounceIcon: React.FC<AnimatedIconProps> = ({
  isAnimating,
  children,
}) => {
  return (
    <motion.div
      variants={IconVariants}
      initial={false}
      animate={
        isAnimating ? IconVariantOptions.bounce : IconVariantOptions.bounceStop
      }
    >
      {children}
    </motion.div>
  );
};

export const AnimatedRotateIcon: React.FC<AnimatedIconProps> = ({
  isAnimating,
  children,
}) => {
  return (
    <motion.div
      variants={IconVariants}
      initial={false}
      animate={
        isAnimating ? IconVariantOptions.rotate : IconVariantOptions.rotateStop
      }
    >
      {children}
    </motion.div>
  );
};
