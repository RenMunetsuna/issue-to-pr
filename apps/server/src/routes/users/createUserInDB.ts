import type { Prisma } from "@prisma/client";
import type { Result } from "@/types";
import type { CreateUserResponse } from "./schema";
import { Role } from "@prisma/client";

export const createUserInDB = async ({
  email,
  name,
  role,
  prisma,
}: {
  email: string;
  name: string;
  role: Role;
  prisma: Prisma;
}): Promise<
  Result<CreateUserResponse[200], { errorCode: 610 | 620 | 800 }>
> => {
  try {
    // ユーザーの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser)
      return {
        success: false,
        error: {
          errorCode: 610,
          message: "既にそのメールアドレスは使用されています",
        },
      };

    // トランザクション内でのユーザー作成
    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          role,
          profile: {
            create: {}, // プロファイルも同時に作成
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      return user;
    });

    return {
      success: true,
      data: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
        createdAt: createdUser.createdAt.getTime(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        errorCode: 800,
        message: "ユーザー作成中にエラーが発生しました",
      },
    };
  }
};
