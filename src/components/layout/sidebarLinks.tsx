'use client';

import Link from 'next/link';
import React from 'react';

const SidebarLinks: React.FC = () => {
  return (
    <div>
      <div>
        <Link href='#'>Link 1</Link>
      </div>
      <div>
        <Link href='#'>Link 2</Link>
      </div>
      <div>
        <Link href='#'>Link 3</Link>
      </div>
    </div>
  );
};

export default SidebarLinks;
