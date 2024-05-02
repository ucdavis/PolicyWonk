// top-level focus types
export type FocusName = 'core' | 'apm' | 'unions';

// individual focus scopes which tie to specific policy groups in the index
export type FocusScope =
  | 'ucop'
  | 'ucdppm'
  | 'ucdppsm'
  | 'ucddelegation'
  | 'ucdinterim'
  | 'ucdapm'
  | 'collective_bargaining_contracts';

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

type Union = {
  key: string;
  value: string;
};

// TODO: grab unions from the db/index somehow? or just hardcode them?
// For now this is hardcoded & includes UCOP + UC Davis unions
export const unions: Union[] = [
  { key: 'bx', value: 'Academic Student Employees' },
  { key: 'cx', value: 'Clerical & Allied Services' },
  { key: 'br', value: 'Graduate Student Researchers' },
  { key: 'hx', value: 'Health Care Professionals' },
  { key: 'ix', value: 'Non-Senate Instructional (Lecturers)' },
  { key: 'ex', value: 'Patient Care Technical' },
  { key: 'dx', value: 'Physicians, Dentists and Podiatrists' },
  { key: 'pa', value: 'Police Officers' },
  { key: 'px', value: 'Postdoctoral Scholars' },
  { key: 'lx', value: 'Professional Librarians' },
  { key: 'nx', value: 'Registered Nurses' },
  { key: 'rx', value: 'Research Support Professionals' },
  { key: 'sx', value: 'Service' },
  { key: 'tx', value: 'Technical' },
  { key: 'k3', value: 'Skilled Craft' },
  { key: 'f3', value: 'Local 4920' },
  { key: 'm3', value: 'Medical Residents' },
];
