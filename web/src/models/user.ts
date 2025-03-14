export interface Role {
  id: number;
  name: string;
  userRoles: UserRole[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  upn: string;
  kerberos: string | null;
  iam: string | null;
  msUserId: string | null;
  titles: string | null;
  affiliations: string | null;
  departments: string | null;
  userRoles: UserRole[];
}

export interface UserRole {
  userId: number;
  roleId: number;
  user?: User;
  role?: Role;
}

export enum RoleName {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
