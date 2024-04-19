import { UserPortrait } from './userPortrait';

export const UserMessage = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='row mb-3'>
      <div className='col-3 col-md-1 mb-2'>
        <UserPortrait />
      </div>
      <div className='col-10 col-md-11'>
        <p className='chat-name'>
          <strong>{`You: `}</strong>
        </p>
        {children}
      </div>
    </div>
  );
};
