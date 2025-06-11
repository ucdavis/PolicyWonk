// This file contains shared constants used across the application

// Supported campuses for the login page with tenant values
// These campuses are also called "groups" for the purpose of the app
export interface Campus {
  name: string;
  value: string;
  logoPath: string;
  link: string;
}

export const campuses: Campus[] = [
  {
    name: 'UC Office of the President',
    value: 'ucop',
    logoPath: '/media/groups/ucop.svg',
    link: 'https://www.ucop.edu/',
  },
  {
    name: 'UC Davis',
    value: 'ucdavis',
    logoPath: '/media/groups/ucdavis.svg',
    link: 'https://www.ucdavis.edu/',
  },
  {
    name: 'UC Berkeley',
    value: 'ucb',
    logoPath: '/media/groups/ucb.svg',
    link: 'https://www.berkeley.edu/',
  },
  {
    name: 'UC San Francisco',
    value: 'ucsf',
    logoPath: '/media/groups/ucsf.svg',
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
