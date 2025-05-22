import React from 'react';

import DiscreetLinksList, { DiscreetLinks } from '../ui/discreetLinksList';

interface SidebarNavProps {
  links: DiscreetLinks[];
  children?: React.ReactNode;
}

const SidebarNavLinks: React.FC<SidebarNavProps> = ({ children, links }) => {
  return (
    <div className='static-nav-list mb-auto'>
      <h2>Navigation</h2>
      <DiscreetLinksList links={links} />
      {children}
    </div>
  );
};

export default SidebarNavLinks;
