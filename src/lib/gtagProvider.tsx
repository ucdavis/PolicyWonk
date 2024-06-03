/* eslint-disable no-console */
import { GoogleTagManager } from '@next/third-parties/google';

const GtagProvider: React.FC = ({}) => {
  const isProd = process.env.NODE_ENV === 'production';
  const gtmId = process.env.GTM_ID ?? 'GTM-FAKEID';
  const gtmDevAuth = process.env.GTM_DEV_CONTAINER;

  if (!gtmId || gtmId === 'GTM-FAKEID') {
    console.warn('GTM_ID not set');
  }
  if (isProd && gtmDevAuth) {
    console.warn('GTM_DEV_CONTAINER is set in production');
  }
  if (!isProd && !gtmDevAuth) {
    console.warn('GTM_DEV_CONTAINER not set');
  }

  return (
    <GoogleTagManager gtmId={gtmId} auth={isProd ? undefined : gtmDevAuth} />
  );
};

export default GtagProvider;
