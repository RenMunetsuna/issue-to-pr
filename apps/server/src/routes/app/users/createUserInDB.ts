import { Role } from '@prisma/client';
import type { Prisma } from '@/lib';
import type { CreateUserResponse } from './schema';
import type { Result } from '@/types';

type ErrorCode = 600 | 610 | 800;

export const createUserInDB = async ({
  email,
  name,
  role,
  prisma
}: {
  email: string;
  name: string;
  role: Role;
  prisma: Prisma;
}): Promise<Result<CreateUserResponse[200], { errorCode: ErrorCode }>> => {
  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return { success: true, data: user };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: { errorCode: 600 } }; // Email duplicated
      }
    }
    return { success: false, error: { errorCode: 800 } };
  }
};