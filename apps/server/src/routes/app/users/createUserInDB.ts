import type { UserRole } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { CreateUserResponse } from './schema';
import type { Result } from '@/types';

/**
 * ユーザーを新規作成する
 * @param email ユーザーのメールアドレス
 * @param name ユーザーの名前
 * @param role ユーザーの役割
 * @param prisma Prismaインスタンス
 * @returns 作成されたユーザーデータ、またはエラー
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
}): Promise<
  Result<CreateUserResponse[200], { errorCode: 400 | 409 | 500 }>
> => {
  try {
    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser != null) {
      return { success: false, error: { errorCode: 409 } };
    }

    // ユーザーの作成
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role
      }
    });

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
    // バリデーションエラーや内部エラー
    if (error instanceof Prisma.PrismaClientValidationError) {
      return { success: false, error: { errorCode: 400 } };
    }
    return { success: false, error: { errorCode: 500 } };
  }
};