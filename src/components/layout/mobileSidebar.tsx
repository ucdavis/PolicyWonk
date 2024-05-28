'use client';
import React from 'react';

import Link from 'next/link';
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Button } from 'reactstrap';

interface SidebarProps {
  history: React.ReactNode;
  footer: React.ReactNode;
}

const MobileSidebar: React.FC<SidebarProps> = ({ history, footer }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <div>
      <Button color='primary' onClick={toggle}>
        Open
      </Button>
      <Offcanvas
        backdrop={false}
        fade={false}
        isOpen={isOpen}
        scrollable={false}
        toggle={toggle}
      >
        <OffcanvasHeader toggle={toggle}></OffcanvasHeader>
        <OffcanvasBody>
          <div className='mobilesidebar-wrapper'>
            <div className='mobilesidebar-container'>
              <header>
                <h1 className='logo'>
                  <Link href='/'>
                    Policy Wonk <br />
                    <span className='subtitle'>Your UC Policy expert</span>
                  </Link>
                </h1>
                {history}
              </header>
              {footer}
            </div>
          </div>
        </OffcanvasBody>
      </Offcanvas>
    </div>
  );
};

export default MobileSidebar;
