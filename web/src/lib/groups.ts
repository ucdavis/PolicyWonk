import { campuses, campusMap, DEFAULT_GROUP } from './constants';

export const getGroupFromPathname = (pathname: string) => {
  const pathGroup = pathname?.split('/')[1];
  const group = pathGroup && campusMap[pathGroup] ? pathGroup : DEFAULT_GROUP;

  return group;
};

export const getGroupOrDefault = (group: string | undefined) => {
  if (!group || !campusMap[group]) {
    return DEFAULT_GROUP;
  }
  return group;
};

/**
 * Checks if the provided group string is in a valid format and exists in the campus map.
 *
 * A valid group string must:
 * - Be a non-empty string.
 * - Contain only alphanumeric characters, hyphens, or underscores.
 * - Exist as a key in the `campusMap` object.
 *
 * @param group - The group string to validate.
 * @returns `true` if the group string is valid and exists in `campusMap`, otherwise `false`.
 */
export const isValidGroupFormat = (group: string | undefined) => {
  if (!group) {
    return false;
  }

  const groupRegex = /^[a-zA-Z0-9-_]+$/;

  return groupRegex.test(group) && Object.keys(campusMap).includes(group);
};

/**
 * Determines whether the provided group name is valid by checking if it exists as a key in the `campusMap` object.
 *
 * @param group - The group name to validate. Can be a string or undefined.
 * @returns `true` if the group name is defined and is a valid key in `campusMap`, otherwise `false`.
 */
export const isValidGroupName = (group: string | undefined) => {
  if (!group) {
    return false;
  }

  // Check if the group is a valid key in the campusMap
  return Object.keys(campusMap).includes(group);
};

export const getGroupNameFromAffiliation = (affiliations: string[]): string => {
  // Use the first recognized scope, which may differ from the app's group ID.
  for (const aff of affiliations) {
    const scope = aff.match(/^[^@]+@([^@]+)$/)?.[1].toLowerCase();
    const campus = campuses.find(
      (c) => scope && c.affiliationScopes.includes(scope)
    );
    if (campus) {
      return campus.value;
    }
  }
  return DEFAULT_GROUP; // Fallback to default group if no valid affiliation found
};
