import { campusMap, DEFAULT_GROUP } from './constants';

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
  // affiliations is an array of strings like `staff@ucdavis.edu` or `faculty@ucsf.edu`, etc
  // a person can have multiple affiliations, so we need to split by comma and probably just take the first one (or the first valid one)
  // We'll want to try to match each with one of our valid groups
  for (const aff of affiliations) {
    const match = aff.match(/@([a-zA-Z0-9-_]+)\.edu/);
    if (match && match[1] && campusMap[match[1]]) {
      return campusMap[match[1]].value; // return group value (e.g., 'ucdavis', 'ucb', etc)
    }
  }
  return DEFAULT_GROUP; // Fallback to default group if no valid affiliation found
};
