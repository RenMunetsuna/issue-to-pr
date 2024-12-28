import { Prisma } from '@prisma/client';
import type { CreateUserRequest, CreateUserResponse } from './schema';
import type { Result } from '@/types';

/**
 * ユーザーを作成する
 * @param params - リクエストパラメータ
 * @param prisma - Prismaインスタンス
 * @returns ユーザー作成の結果
 */
export const createUserInDB = async (
  params: CreateUserRequest['body'],
  prisma: Prisma.Prisma
): Promise<
  Result<CreateUserResponse[200], { errorCode: 600 | 610 | 620 }>
> => {
  try {
    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: params.email }
    });
    if (existingUser) {
      return { success: false, error: { errorCode: 600 } };
    }

    // ユーザー作成
    const newUser = await prisma.user.create({
      data: {
        email: params.email,
        name: params.name,
        role: params.role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return { success: true, data: newUser };
  } catch (error) {
    // Prismaエラー
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // 一意制約違反
        return { success: false, error: { errorCode: 610 } };
      }
    }
    // その他のエラー
    return { success: false, error: { errorCode: 620 } };
  }
};