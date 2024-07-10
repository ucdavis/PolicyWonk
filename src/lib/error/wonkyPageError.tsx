import ChatHeader from '@/components/chat/chatHeader';
import WonkTop from '@/components/layout/wonkTop';

import { WonkError } from './error';
import WonkyError from './wonkyError';

interface WonkyPageErrorProps {
  error: WonkError;
}

/**
 * @param type 'text' or 'alert'
 * @param thereWasAnErrorLoadingThe As in "There was an error loading the {componentName}". Defaults to "there was an error loading."
 * @param contactLink Whether to include a link to contact the developers
 * @param message Optional message to display at the end
 * @returns Error component
 */

export const WonkyPageError: React.FC<WonkyPageErrorProps> = ({ error }) => {
  console.log('rendering WonkyPageError: ', error);
  return (
    <WonkTop>
      <ChatHeader>
        <WonkyError type='alert'>
          Error: {error.code} - {error.name}
          <br />
          {error.description}
        </WonkyError>
      </ChatHeader>
    </WonkTop>
  );
};

export default WonkyPageError;
