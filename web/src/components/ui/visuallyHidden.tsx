import React from 'react';

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}
const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({
  as: Element = 'span',
  className,
  children,
  ...delegated
}) => {
  return (
    <Element
      className={`visually-hidden${className ? ` ${className}` : ''}`}
      {...delegated}
    >
      {children}
    </Element>
  );
};

export default VisuallyHidden;
