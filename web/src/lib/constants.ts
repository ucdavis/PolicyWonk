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

// Keep UCOP first; alphabetize the remaining display names, treating UCLA as UC Los Angeles.
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
    name: 'Lawrence Berkeley National Laboratory',
    value: 'lbl',
    ssoTenant: 'lbl',
    affiliationScopes: ['lbl.gov'],
    logoPath: '/media/groups/berklab.svg',
    link: 'https://www.lbl.gov/',
  },
  {
    name: 'UC Agriculture and Natural Resources',
    value: 'ucanr',
    ssoTenant: 'ucanr',
    affiliationScopes: ['ucanr.edu'],
    logoPath: '/media/groups/ucanr.svg',
    link: 'https://ucanr.edu/',
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
    name: 'UC Davis',
    value: 'ucdavis',
    ssoTenant: 'ucdavis',
    affiliationScopes: ['ucdavis.edu'],
    logoPath: '/media/groups/ucd.png',
    link: 'https://www.ucdavis.edu/',
  },
  {
    name: 'UC Irvine',
    value: 'uci',
    ssoTenant: 'uci',
    affiliationScopes: ['uci.edu'],
    logoPath: '/media/groups/uci.svg',
    link: 'https://www.uci.edu/',
  },
  {
    name: 'UC Law San Francisco',
    value: 'uclawsf',
    ssoTenant: 'uclawsf',
    affiliationScopes: ['uclawsf.edu', 'uchastings.edu'],
    logoPath: '/media/groups/uclawsf.svg',
    link: 'https://www.uclawsf.edu/',
  },
  {
    name: 'UCLA',
    value: 'ucla',
    ssoTenant: 'ucla',
    affiliationScopes: ['ucla.edu'],
    logoPath: '/media/groups/ucla.svg',
    link: 'https://www.ucla.edu/',
  },
  {
    name: 'UC Merced',
    value: 'ucmerced',
    ssoTenant: 'ucmerced',
    affiliationScopes: ['ucmerced.edu'],
    logoPath: '/media/groups/ucm.png',
    link: 'https://www.ucmerced.edu/',
  },
  {
    name: 'UC Riverside',
    value: 'ucr',
    ssoTenant: 'ucr',
    affiliationScopes: ['ucr.edu'],
    logoPath: '/media/groups/ucr.png',
    link: 'https://www.ucr.edu/',
  },
  {
    name: 'UC San Diego',
    value: 'ucsd',
    ssoTenant: 'ucsd',
    affiliationScopes: ['ucsd.edu'],
    logoPath: '/media/groups/ucsd.png',
    link: 'https://www.ucsd.edu/',
  },
  {
    name: 'UC San Francisco',
    value: 'ucsf',
    ssoTenant: 'ucsf',
    affiliationScopes: ['ucsf.edu'],
    logoPath: '/media/groups/ucsf.png',
    link: 'https://www.ucsf.edu/',
  },
  {
    name: 'UC Santa Barbara',
    value: 'ucsb',
    ssoTenant: 'ucsb',
    affiliationScopes: ['ucsb.edu'],
    logoPath: '/media/groups/ucsb.svg',
    link: 'https://www.ucsb.edu/',
  },
  {
    name: 'UC Santa Cruz',
    value: 'ucsc',
    ssoTenant: 'ucsc',
    affiliationScopes: ['ucsc.edu'],
    logoPath: '/media/groups/ucsc.svg',
    link: 'https://www.ucsc.edu/',
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
