import NextAuth from 'next-auth';
import BoxyHQSAMLProvider from 'next-auth/providers/boxyhq-saml';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
} = NextAuth({
  providers: [
    BoxyHQSAMLProvider({
      authorization: { params: { scope: '' } }, // This is needed for OAuth 2.0 flow, otherwise default to openid (from docs)
      issuer: 'https://policywonk-sso.azurewebsites.net',
      clientId: 'dummy', // special boxyhq to signal we are going multi-tenant
      clientSecret: 'dummy',
      checks: ['state'],
    }),
  ],
  callbacks: {
    async jwt(params) {
      console.log('jwt', params);
      return params.token;
    },
  },
  // callbacks: {
  //   async jwt(params) {
  //     console.log('jwt', params);

  //     // params.account has token info -- use to get picture or additional info from provider
  //     // params.profile has user info -- oid is the unique user id, email, name also useful.
  //     if (params.trigger === 'signIn') {
  //       // profile is only available on sign in
  //       const token = {
  //         ...params.token,
  //         name: params.profile?.name,
  //         email: params.profile?.email,
  //         userId: params.profile?.oid,
  //       };

  //       return token;
  //     } else {
  //       return params.token;
  //     }
  //   },
  //   async session(params) {
  //     console.log('session', params);

  //     params.session.user.id = (params.token.userId as string) || '';

  //     return params.session;
  //   },
  // },
});
