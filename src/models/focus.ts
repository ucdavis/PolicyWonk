export type FocusName = 'core' | 'apm' | 'unions';

export type Focus = {
  name: FocusName;
  subFocus?: string; // optional detail for specific focus types
  description: string;
};

export const focuses: Focus[] = [
  {
    name: 'core',
    description: 'UCOP & Ellucid Policies (ppm, ppsm, delegations)',
  },
  {
    name: 'apm',
    description: 'Academic Personnel Manual',
  },
  {
    name: 'unions',
    description: 'UCOP Union Contracts',
  },
];
