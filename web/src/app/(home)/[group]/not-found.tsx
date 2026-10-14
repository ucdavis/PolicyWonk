import { WonkStatusCodes } from '@/lib/error/error';
import WonkyPageError from '@/lib/error/wonkyPageError';

const NotFound: React.FC = () => {
  return <WonkyPageError status={WonkStatusCodes.NOT_FOUND} />;
};

export default NotFound;
