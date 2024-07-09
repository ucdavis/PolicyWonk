'use client';
import React from 'react';

import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Button } from 'reactstrap';

import { buildVersion } from '@/models/static';

interface SidebarProps {
  history: React.ReactNode;
}

const MobileSidebar: React.FC<SidebarProps> = ({ history }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggle = () => {
    setIsOpen(!isOpen);
  };

  const pathname = usePathname();
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div>
      <Button color='offcanvas' onClick={toggle}>
        <FontAwesomeIcon icon={faBars} />
      </Button>
      <Offcanvas
        backdrop={true}
        backdropClassName='offcanvas-backdrop-hide'
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
              <div className='alert-tag alert-tag-mobile'>
                <p>BETA v{buildVersion}</p>
              </div>
            </div>
          </div>
        </OffcanvasBody>
      </Offcanvas>
    </div>
  );
};

export default MobileSidebar;
