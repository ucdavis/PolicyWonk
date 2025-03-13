import prisma from '@/lib/db';
import { RoleName, User } from '@/models/user';

export async function ensureUserExists(userInfo: User): Promise<User> {
  if (!userInfo.upn) {
    throw new Error('UPN is required');
  }

  try {
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
        id: undefined,
        user_roles: undefined,
      },
      include: {
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    // Check if user has USER role, if not add it
    const userRole = user.user_roles.find(
      (ur) => ur.roles.name === RoleName.USER
    );
    if (!userRole) {
      const role = await prisma.roles.findFirst({
        where: { name: RoleName.USER },
      });

      if (!role) {
        throw new Error('USER role not found in database');
      }

      await prisma.user_roles.create({
        data: {
          user_id: user.id,
          role_id: role.id,
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
      msUserId: user.ms_user_id || '',
      titles: user.titles,
      affiliations: user.affiliations,
      departments: user.departments,
      userRoles: user.user_roles.map((ur) => ({
        userId: ur.user_id,
        roleId: ur.role_id,
        role: {
          id: ur.roles.id,
          name: ur.roles.name,
          userRoles: [],
        },
      })),
    };
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}
