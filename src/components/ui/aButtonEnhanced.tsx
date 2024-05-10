'use client';
import React from 'react';

import { Variant, useAnimate } from 'framer-motion';

import AnimatedButton, { AnimatedButtonProps } from './aButton';

interface AnimatedButtonEnhancedProps extends AnimatedButtonProps {
  animateOnEnter?: boolean;
  animateOnChange?: boolean | string;
  trackedValue?: string | boolean;
  clearOnChange?: boolean | string;
}

const AnimatedButtonEnhanced: React.FC<AnimatedButtonEnhancedProps> = ({
  animateOnEnter = false,
  animateOnChange = false,
  trackedValue,
  clearOnChange = false,
  ...rest
}) => {
  const [scope, animate] = useAnimate();

  const a: Variant = React.useMemo(() => {
    return {
      transition: {
        delay: 1,
      },
      scale: [
        null,
        1.2, // hover
        0.8, // tap
        1.2, // hover
        1, // default
      ],
      color: [
        null,
        'var(--secondary-color)',
        'var(--primary-color)',
        'var(--secondary-color)',
        'var(--tertiary-color)',
      ],
    };
  }, []);

  React.useEffect(() => {
    if (!animateOnEnter) {
      return;
    }

    const animation = async () => {
      await animate(scope.current, a);
    };

    animation();
  }, [animateOnEnter, scope, animate, a]);

  React.useEffect(() => {
    if (!animateOnChange || !trackedValue) {
      return;
    }

    const animation = async () => {
      await animate(scope.current, a);
    };

    animation();
  }, [animateOnChange, trackedValue, scope, animate, a]);

  return <AnimatedButton {...rest} scope={scope} initial={animateOnEnter} />;
};

export default AnimatedButtonEnhanced;
