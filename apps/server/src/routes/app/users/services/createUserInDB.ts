import { Prisma, UserRole } from '@prisma/client';
import { Result } from '@/types';

type ErrorCode = 630 | 800;

export const createUserInDB = async ({
  email,
  name,
  role,
  prisma,
}: {
  email: string;
  name: string;
  role: UserRole;
  prisma: Prisma;
}): Promise<Result<{ id: string; email: string; name: string; role: UserRole; createdAt: number }, ErrorCode>> => {
  try {
    // ユーザーが既に存在するかチェック
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser !== null) {
      return { success: false, error: { errorCode: 630 } };
    }

    // ユーザーを作成
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt.getTime(),
      },
    };
  } catch (error) {
    return { success: false, error: { errorCode: 800 } };
  }
};