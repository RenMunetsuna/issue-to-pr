import type { Prisma } from '@/lib';
import type { Result } from '@/types';
import type { CreateUserResponse } from './schema';

/**
 * ユーザーを作成
 */
export const createUserInDB = async ({
  email,
  name,
  role,
  prisma
}: {
  email: string;
  name: string;
  role: string;
  prisma: Prisma;
}): Promise<Result<CreateUserResponse[200], { errorCode: 600 | 610 }>> => {
  try {
    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser != null)
      return { success: false, error: { errorCode: 600 } };

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        profile: {
          create: {} // 空のプロフィールを同時作成
        }
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
    return { success: false, error: { errorCode: 610 } };
  }
};