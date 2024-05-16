import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

import { IconVariantOptions, IconVariants } from '@/models/animations';

interface AnimatedIconProps {
  icon: IconProp;
  isAnimating: boolean;
}

export const AnimatedBounceIcon: React.FC<AnimatedIconProps> = ({
  icon,
  isAnimating,
}) => {
  return (
    <motion.div
      variants={IconVariants}
      initial={false}
      animate={
        isAnimating ? IconVariantOptions.bounce : IconVariantOptions.bounceStop
      }
    >
      <FontAwesomeIcon icon={icon} />
    </motion.div>
  );
};

export const AnimatedRotateIcon: React.FC<AnimatedIconProps> = ({
  icon,
  isAnimating,
}) => {
  return (
    <motion.div
      variants={IconVariants}
      initial={false}
      animate={
        isAnimating ? IconVariantOptions.rotate : IconVariantOptions.rotateStop
      }
    >
      <FontAwesomeIcon icon={icon} />
    </motion.div>
  );
};
