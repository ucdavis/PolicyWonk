import prisma from '@/lib/db';
import { RoleName, User } from '@/models/user';

export async function ensureUserExists(userInfo: Partial<User>): Promise<User> {
  if (!userInfo.upn) {
    throw new Error('UPN is required');
  }

  // Get or create user with updated info
  const user = await prisma.users.upsert({
    where: {
      upn: userInfo.upn,
    },
    update: {
      // Only update if values are provided
      ...(userInfo.name && { name: userInfo.name }),
      ...(userInfo.email && { email: userInfo.email }),
      ...(userInfo.kerberos && { kerberos: userInfo.kerberos }),
      ...(userInfo.iam && { iam: userInfo.iam }),
      ...(userInfo.msUserId && { ms_user_id: userInfo.msUserId }),
      ...(userInfo.titles && { titles: userInfo.titles }),
      ...(userInfo.affiliations && { affiliations: userInfo.affiliations }),
      ...(userInfo.departments && { departments: userInfo.departments }),
    },
    create: {
      ...userInfo,
      name: userInfo.name || '',
      email: userInfo.email || '',
      upn: userInfo.upn,
      id: undefined,
      userRoles: undefined,
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  // Check if user has USER role, if not add it
  const userRole = user.userRoles.find((ur) => ur.role.name === RoleName.USER);
  if (!userRole) {
    const role = await prisma.roles.findFirst({
      where: { name: RoleName.USER },
    });

    if (!role) {
      throw new Error('USER role not found in database');
    }

    await prisma.userRoles.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });
  }

  // Return updated user with roles
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    upn: user.upn,
    kerberos: user.kerberos || '',
    iam: user.iam || '',
    msUserId: user.msUserId || '',
    titles: user.titles,
    affiliations: user.affiliations,
    departments: user.departments,
    userRoles: user.userRoles.map((ur) => ({
      userId: ur.userId,
      roleId: ur.roleId,
    })),
  };
}
