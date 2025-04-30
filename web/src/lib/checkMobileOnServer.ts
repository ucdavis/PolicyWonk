export const checkMobileOnServer = (headersList: Headers) => {
  const userAgent = headersList.get('user-agent') || '';

  const isMobile = /mobile|iphone|ipad|android/i.test(userAgent);

  return isMobile;
};
