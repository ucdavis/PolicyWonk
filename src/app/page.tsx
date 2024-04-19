import React from 'react';

import { redirect } from 'next/navigation';

const RedirectComponent: React.FC = () => {
  redirect('/chat/new');
};

export default RedirectComponent;
