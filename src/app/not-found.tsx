import { WonkStatusCodes } from '@/lib/error/error';
import WonkyPageError from '@/lib/error/wonkyPageError';

/**
 * Next.js page component for the 404 page.
 */
const NotFound: React.FC = () => {
  return <WonkyPageError status={WonkStatusCodes.NOT_FOUND} />;
};

export default NotFound;
