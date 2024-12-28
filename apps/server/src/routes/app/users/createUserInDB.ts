import { Role } from '@prisma/client';
import type { Prisma } from '@/lib';
import type { Result } from '@/types';
import type { CreateUserResponse } from './schema';

type ErrorCode = 400 | 409 | 800;

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
    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { success: false, error: { errorCode: 409 } };

    // ユーザー作成
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
    return { success: false, error: { errorCode: 800 } };
  }
};