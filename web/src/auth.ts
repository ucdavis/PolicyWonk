import NextAuth, { Profile } from 'next-auth';
import BoxyHQSAMLProvider from 'next-auth/providers/boxyhq-saml';

import { setCurrentGroup } from './lib/cookies';
import { User } from './models/user';
import { ensureUserExists } from './services/userService';

const SamlClaims = {
  name: 'urn:oid:2.16.840.1.113730.3.1.241',
  upn: 'urn:oid:1.3.6.1.4.1.5923.1.1.1.6', // unique id - resembles email but isn't actually email
  email: 'urn:oid:0.9.2342.19200300.100.1.3',
  affiliation: 'urn:oid:1.3.6.1.4.1.5923.1.1.1.9', // array scoped affiliations, ex: ["staff@ucdavis.edu"]
  nameIdentifier:
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
};

interface ProfileWithRaw extends Profile {
  raw: Record<string, string | string[]>;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    BoxyHQSAMLProvider({
      authorization: { params: { scope: '' } }, // This is needed for OAuth 2.0 flow, otherwise default to openid (from docs)
      issuer: process.env.SSO_ISSUER_URL,
      clientId: 'dummy', // special boxyhq to signal we are going multi-tenant
      clientSecret: 'dummy',
      checks: ['state'],
    }),
  ],
  callbacks: {
    async jwt(params) {
      // console.log('jwt', params);
      // params.profile has user info -- params.profile.raw has the shibboleth claims
      // params.profile.requested.tenant has the tenant as defined by boxy -- might be nice for multi-tenant
      if (params.trigger === 'signIn') {
        // profile is only available on sign in
        const profileExtended = params.profile as ProfileWithRaw | undefined;

        const rawAffiliations = profileExtended?.raw?.[SamlClaims.affiliation];
        const affiliations: string[] = rawAffiliations
          ? Array.isArray(rawAffiliations)
            ? rawAffiliations
            : [rawAffiliations]
          : [];

        const extractClaim = (
          value: string | string[] | undefined
        ): string | undefined => {
          return Array.isArray(value) ? value[0] : value;
        };

        const userFromToken: Partial<User> = {
          name: extractClaim(profileExtended?.raw?.[SamlClaims.name]),
          email: extractClaim(profileExtended?.raw?.[SamlClaims.email]),
          upn: extractClaim(profileExtended?.raw?.[SamlClaims.upn]),
          affiliations: affiliations.join(','),
        };

        const user = await ensureUserExists(userFromToken);

        // TODO: find user's group from affiliations. if we can't find it, go to a chooser
        setCurrentGroup('ucdavis');

        const token = {
          ...params.token,
          name: user.name,
          email: user.email,
          userId: user.id,
        };

        return token;
      }

      return params.token;
    },
    async session({ session, token }) {
      // we need a valid numeric userId on the token to add to the session
      if (!token.userId || isNaN(Number(token.userId))) {
        // Throwing an error forces a relogin.
        throw new Error('Invalid Session');
      }

      // we want to add the user id to the session
      if (session) {
        session.userId = token.userId as string;
      }

      return session;
    },
  },
});
