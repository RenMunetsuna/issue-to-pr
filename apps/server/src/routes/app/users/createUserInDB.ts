import { Role } from '@prisma/client';
import type { Prisma } from '@/lib';
import type { CreateUserRequest, CreateUserResponse } from './schema';

type ErrorCode = 600 | 610 | 800;

/**
 * ユーザーを作成する
 */
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
    // 重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser != null) {
      return { success: false, error: { errorCode: 600 } };
    }

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role
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
    // eslint-disable-next-line functional/no-expression-statements
    console.error(error);
    return { success: false, error: { errorCode: 800 } };
  }
};