export type Focus = {
  name: 'core' | 'apm' | 'unions';
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
