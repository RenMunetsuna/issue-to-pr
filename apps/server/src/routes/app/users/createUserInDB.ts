import { Prisma, UserRole } from '@prisma/client';
import type { Result } from '@/types';
import type { CreateUserResponse } from './schema';

type ErrorCode = 630 | 800;

export const createUserInDB = async ({
  email,
  name,
  role,
  prisma
}: {
  email: string;
  name: string;
  role: UserRole;
  prisma: Prisma;
}): Promise<Result<CreateUserResponse[200], { errorCode: ErrorCode }>> => {
  try {
    const existingUser = await prisma.rUser.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { success: false, error: { errorCode: 630 } };
    }

    const user = await prisma.rUser.create({
      data: {
        email,
        name,
        role,
        currentStatus: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.getTime()
      }
    };
  } catch (error) {
    return { success: false, error: { errorCode: 800 } };
  }
};