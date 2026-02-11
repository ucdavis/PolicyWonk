// top-level focus types
export type FocusName = 'core' | 'apm' | 'unions' | 'knowledgebase' | 'ucop';

// individual focus scopes which tie to specific policy groups in the index
export type FocusScope =
  | 'UCOP'
  | 'UCDPOLICY'
  | 'UCDAPM'
  | 'UCCOLLECTIVEBARGAINING'
  | 'UCDKB'
  | '1' // UCOP source_id
  | '2' // UCDPOLICY source_id
  | '3' // UCDAPM source_id
  | '4'; // UCCOLLECTIVEBARGAINING source_id

export type Focus = {
  name: FocusName;
  subFocus?: string; // optional detail for specific focus types
  description: string;
  groups: string[]; // groups that this focus applies to, or include 'all'
  priority?: number; // optional priority for sorting, lower is more important
};

export const focuses: Focus[] = [
  {
    name: 'core',
    description:
      'UC & UC Davis Admin (PPM), Personnel (PPSM), Delegations of Authority (DA) Policies',
    groups: ['ucdavis'],
    priority: 1,
  },
  {
    name: 'apm',
    description: 'Academic Personnel Manual',
    groups: ['ucdavis'],
    priority: 3,
  },
  {
    name: 'unions',
    description: 'UCOP Union Contracts',
    groups: ['all'],
    priority: 4,
  },
  {
    name: 'knowledgebase',
    description: 'UC Davis Knowledge Base',
    groups: ['ucdavis'],
    priority: 5,
  },
  {
    name: 'ucop',
    description: 'UCOP Policies (policies.ucop.edu)',
    groups: ['all'],
    priority: 2,
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
        subFocus: union.key,
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

export const getFocusesForGroup = (group: string): Focus[] => {
  // always get 'all' focuses, then add in the group-specific ones
  const groupFocuses = focuses.filter(
    (f) => f.groups.includes('all') || f.groups.includes(group)
  );

  // sort by priority, if defined, otherwise by name
  return groupFocuses.sort((a, b) => {
    if (a.priority && b.priority) {
      return a.priority - b.priority; // sort by priority if both have it
    }
    return a.name.localeCompare(b.name); // fallback to alphabetical order
  });
};
