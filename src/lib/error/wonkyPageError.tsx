import ChatHeader from '@/components/chat/chatHeader';
import WonkTop from '@/components/layout/wonkTop';

import { WonkStatusCodes, WonkStatusMessages } from './error';

interface WonkyPageErrorProps {
  status: WonkStatusCodes;
}

export const WonkyPageError: React.FC<WonkyPageErrorProps> = ({ status }) => {
  const errorObj = WonkStatusMessages[status];

  return (
    <WonkTop>
      <ChatHeader>
        {errorObj.code}: {errorObj.name}
        <br />
        {errorObj.message}
      </ChatHeader>
    </WonkTop>
  );
};

export default WonkyPageError;
