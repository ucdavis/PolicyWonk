/* eslint-disable no-console */
import { GoogleTagManager } from '@next/third-parties/google';

const GtagProvider: React.FC = ({}) => {
  const isProd = process.env.NODE_ENV === 'production';
  const gtmId = process.env.GTM_ID || '';
  const gtmDevAuth = process.env.GTM_DEV_AUTH;

  return (
    <GoogleTagManager
      gtmId={gtmId}
      auth={isProd ? undefined : gtmDevAuth} // this is the dev auth code, it sets debug mode = true and ignores that traffic
    />
  );
};

export default GtagProvider;
