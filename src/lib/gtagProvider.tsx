/* eslint-disable no-console */
import { GoogleTagManager } from '@next/third-parties/google';

const GtagProvider: React.FC = ({}) => {
  const isProd = process.env.NODE_ENV === 'production';

  return (
    <GoogleTagManager
      gtmId={'GTM-NNCH6SSL'}
      auth={isProd ? undefined : 'T7xzzHtiL7qvsrzA611c5A'} // this is the dev auth code, it sets debug mode = true and ignores that traffic
    />
  );
};

export default GtagProvider;
