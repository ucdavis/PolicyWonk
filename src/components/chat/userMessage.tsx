import { UserPortrait } from './userPortrait';

export const UserMessage = ({
  user,
  children,
}: {
  user?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className='row mb-3'>
      <div className='col-2 mb-2'>
        <UserPortrait />
      </div>
      <div className='col-10'>
        <p className='chat-name'>
          <strong>{!!user ? user : `You: `}</strong>
        </p>
        <p>{children}</p>
      </div>
    </div>
  );
};
