'use client';
import React from 'react';

import Link from 'next/link';
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Button } from 'reactstrap';

import ChatHistory from '../chatHistory/chatHistory';

import Footer from './footer';

const MobileSidebar: React.FC = () => {
  return (
    <div className='sidebar-container'>
      <div>
        <Button color='primary' onClick={() => {}}>
          Open
        </Button>
        <Offcanvas backdrop={false} fade={false} scrollable toggle={() => {}}>
          <OffcanvasHeader toggle={() => {}}>Offcanvas</OffcanvasHeader>
          <OffcanvasBody>
            <header>
              mobile sidebar is here
              <h1 className='logo'>
                <Link href='/'>
                  Policy Wonk <br />
                  <span className='subtitle'>Your UC Policy expert</span>
                </Link>
              </h1>
              <ChatHistory />
            </header>
            <Footer />
          </OffcanvasBody>
        </Offcanvas>
      </div>
    </div>
  );
};

export default MobileSidebar;
