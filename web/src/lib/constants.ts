// This file contains shared constants used across the application

// Campus groups, Jackson SSO tenants, and affiliation scopes are separate identifiers.
export interface Campus {
  name: string;
  value: string;
  ssoTenant: string;
  affiliationScopes: string[];
  logoPath: string;
  link: string;
}

export const campuses: Campus[] = [
  {
    name: 'UC Office of the President',
    value: 'ucop',
    ssoTenant: 'ucop',
    affiliationScopes: ['ucop.edu'],
    logoPath: '/media/groups/ucop.png',
    link: 'https://www.ucop.edu/',
  },
  {
    name: 'UC Davis',
    value: 'ucdavis',
    ssoTenant: 'ucdavis',
    affiliationScopes: ['ucdavis.edu'],
    logoPath: '/media/groups/ucdavis.png',
    link: 'https://www.ucdavis.edu/',
  },
  {
    name: 'UC Berkeley',
    value: 'ucb',
    ssoTenant: 'ucberkeley',
    affiliationScopes: ['berkeley.edu'],
    logoPath: '/media/groups/ucb.png',
    link: 'https://www.berkeley.edu/',
  },
  {
    name: 'UC San Francisco',
    value: 'ucsf',
    ssoTenant: 'ucsf',
    affiliationScopes: ['ucsf.edu'],
    logoPath: '/media/groups/ucsf.png',
    link: 'https://www.ucsf.edu/',
  },
];

export const DEFAULT_GROUP = 'ucdavis'; // Default group for the app, mostly for error handling

export const campusMap: Record<string, Campus> = campuses.reduce(
  (acc, campus) => {
    acc[campus.value] = campus;
    return acc;
  },
  {} as Record<string, Campus>
);
