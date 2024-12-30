import type { Prisma } from '@/lib';
import type { Result } from '@/types';
import type { CreateUserResponse } from './schema';
import type { Role } from '@prisma/client';

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
}): Promise<
  Result<CreateUserResponse[200], { errorCode: 400 | 409 | 500 }>
> => {
  try {
    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true } 
    });

    if (existingUser) 
      return { success: false, error: { errorCode: 409 } };

    // ユーザー作成
    const user = await prisma.user.create({
      data: { email, name, role },
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
    return { success: false, error: { errorCode: 500 } };
  }
};