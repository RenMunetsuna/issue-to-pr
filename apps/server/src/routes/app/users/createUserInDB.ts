import { Prisma, UserRole } from '@prisma/client';
import type { CreateUserResponse } from './schema';
import type { Result } from '@/types';

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
  role: UserRole;
  prisma: Prisma;
}): Promise<Result<CreateUserResponse[200], { errorCode: 630 | 640 }>> => {
  try {
    // メールアドレスの重複をチェック
    const existingUser = await prisma.rUser.findUnique({
      where: { email }
    });
    if (existingUser != null) {
      return { success: false, error: { errorCode: 630 } };
    }

    // ユーザーを作成
    const newUser = await prisma.rUser.create({
      data: {
        email,
        name,
        role,
        createdAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // 作成したユーザーデータを返却
    return {
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt.getTime()
      }
    };
  } catch (error) {
    // Prismaエラーの場合
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: { errorCode: 640 } };
    }
    // 予期しないエラーの場合
    throw error;
  }
};