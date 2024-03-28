'use client';

import Link from 'next/link';
import React from 'react';

const SidebarLinks: React.FC = () => {
  return (
    <div>
      <div>
        <Link href='#'>Internal Link</Link>
      </div>
      <div>
        <a href='#'>External Link</a>
      </div>
    </div>
  );
};

export default SidebarLinks;
