import NextAuth from "next-auth";
import Auth0Provider from "@auth/core/providers/auth0";

export const {
  handlers: { GET, POST },
  auth,
  signIn
} = NextAuth({
  session: { strategy: 'jwt' }, // needed?
  providers: [
    Auth0Provider({

      issuer: "https://cas.ucdavis.edu/cas/oidc",
      wellKnown:
        "https://cas.ucdavis.edu/cas/oidc/.well-known/openid-configuration",
      authorization: { params: { scope: "openid eduPerson" } },
    }),
  ],
  secret: "LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=",
});
