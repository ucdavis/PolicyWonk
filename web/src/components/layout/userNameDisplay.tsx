'use client';
import { useSession } from 'next-auth/react';

const UserNameDisplay: React.FC = ({}) => {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <>
      <p className='mb-0'>
        <span className='me-1'>Logged in as:</span>
        {session?.user?.name}
      </p>
    </>
  );
};
export default UserNameDisplay;
