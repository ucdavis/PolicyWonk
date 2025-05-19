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
