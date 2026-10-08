import ChatHeader from '../../components/chat/chatHeader';

import { WonkStatusCodes, WonkStatusMessages } from './error';

interface WonkyPageErrorProps {
  status: WonkStatusCodes;
}

export const WonkyPageError: React.FC<WonkyPageErrorProps> = ({ status }) => {
  const errorObj = WonkStatusMessages[status];

  return (
    <div className='min-h-0 flex-1 overflow-y-auto pt-4'>
      <div className='mx-auto w-full max-w-3xl'>
        <ChatHeader>
          {errorObj.code}: {errorObj.name}
          <br />
          {errorObj.message}
        </ChatHeader>
      </div>
    </div>
  );
};

export default WonkyPageError;
