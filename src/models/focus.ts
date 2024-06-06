// top-level focus types
export type FocusName = 'core' | 'apm' | 'unions' | 'knowledgebase';

// individual focus scopes which tie to specific policy groups in the index
export type FocusScope =
  | 'ucop'
  | 'ucdppm'
  | 'ucdppsm'
  | 'ucddelegation'
  | 'ucdinterim'
  | 'ucdapm'
  | 'collective_bargaining_contracts'
  | 'ucdknowledgebase';

export type Focus = {
  name: FocusName;
  subFocus?: string; // optional detail for specific focus types
  description: string;
};

export const focuses: Focus[] = [
  {
    name: 'core',
    description:
      'UC & UCD Admin (PPM), Personnel (PPSM), Delegations of Authority (DA) Policies',
  },
  {
    name: 'apm',
    description: 'Academic Personnel Manual',
  },
  {
    name: 'unions',
    description: 'UCOP Union Contracts',
  },
  {
    name: 'knowledgebase',
    description: 'UC Davis Knowledge Base',
  },
];

export type Union = {
  key: string;
  value: string;
};

// TODO: grab unions from the db/index somehow? or just hardcode them?
// For now this is hardcoded & includes UCOP + UC Davis unions
export const unions: Union[] = [
  { key: 'ra', value: 'Academic Researchers' },
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

// get a focus w/ sub-focus if it exists, otherwise return undefined
export const getFocusWithSubFocus = (
  focus?: string,
  subFocus?: string
): Focus | undefined => {
  const foundFocus = focuses.find((f) => f.name === focus);

  if (!foundFocus) {
    return;
  }

  // right now, we only have unions as a focus with sub-focus
  if (foundFocus.name === 'unions') {
    // find the union by key
    const union = unions.find((u) => u.key === subFocus);

    // if we found the union, we can return the focus with the union name as the subFocus
    if (union) {
      return {
        ...foundFocus,
        subFocus: union.value,
        description: getUnionDescription(union),
      };
    }
  } else {
    // if the focus doesn't have a sub-focus, we can just return the focus
    return foundFocus;
  }
};

export const getUnionDescription = (union: Union): string => {
  return union ? `${union.value} (${union.key})` : '';
};
