import NextAuth from 'next-auth';
import AzureAd from 'next-auth/providers/azure-ad';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
} = NextAuth({
  providers: [
    AzureAd({
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
      tenantId: process.env.AZURE_TENANT_ID,
      // need domain_hint to force login with ucdavis.edu and bypass the account selector
      authorization: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/authorize?response_type=code&domain_hint=ucdavis.edu`,
    }),
  ],
  callbacks: {
    async jwt(params) {
      // params.account has token info -- use to get picture or additional info from provider
      // params.profile has user info -- oid is the unique user id, email, name also useful.
      if (params.trigger === 'signIn') {
        // profile is only available on sign in
        const token = {
          ...params.token,
          name: params.profile?.name,
          email: params.profile?.email,
          userId: params.profile?.oid,
        };

        return token;
      } else {
        return params.token;
      }
    },
    async session(params) {
      params.session.user.id = (params.token.userId as string) || '';

      return params.session;
    },
  },
});
