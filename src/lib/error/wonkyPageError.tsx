import ChatHeader from '@/components/chat/chatHeader';
import WonkTop from '@/components/layout/wonkTop';

import { WonkErrorMessage, WonkStatusCodes, WonkStatusMessages } from './error';

interface WonkyPageErrorProps {
  error: WonkErrorMessage | WonkStatusCodes;
  children?: React.ReactNode;
}

export const WonkyPageError: React.FC<WonkyPageErrorProps> = ({
  error,
  children,
}) => {
  const errorObj =
    typeof error === 'string' ? WonkStatusMessages[error] : error;
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
