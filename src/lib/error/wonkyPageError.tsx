import ChatHeader from '@/components/chat/chatHeader';
import WonkTop from '@/components/layout/wonkTop';

import { WonkStatusCodes, WonkStatusMessages } from './error';

interface WonkyPageErrorProps {
  status: WonkStatusCodes;
  children?: React.ReactNode;
}

export const WonkyPageError: React.FC<WonkyPageErrorProps> = ({
  status,
  children,
}) => {
  const errorObj = WonkStatusMessages[status];

  return (
    <WonkTop>
      <ChatHeader>
        <h2>
          {errorObj.code}: {errorObj.name}
        </h2>
        <p>{errorObj.message}</p>
        {children}
      </ChatHeader>
    </WonkTop>
  );
};

export default WonkyPageError;
