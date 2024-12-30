import type { Prisma } from "@/lib";
import type { Result } from "@/types";
import type { CreateProfileResponse } from "./schema";

export const createProfileInDB = async ({
  userId,
  bio,
  avatar,
  birthDate,
  location,
  prisma,
}: {
  userId: string;
  bio: string;
  avatar: string;
  birthDate: Date;
  location: string;
  prisma: Prisma;
}): Promise<
  Result<CreateProfileResponse[200], { errorCode: 400 | 404 | 500 }>
> => {
  try {
    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (user == null)
      return {
        success: false,
        error: { errorCode: 404, message: "ユーザーが見つかりません" },
      };

    // プロフィール作成
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        bio,
        avatar,
        birthDate,
        location,
      },
      create: {
        userId,
        bio,
        avatar,
        birthDate,
        location,
      },
      select: {
        id: true,
        bio: true,
        avatar: true,
        birthDate: true,
        location: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: {
        ...profile,
        createdAt: profile.createdAt.getTime(),
        updatedAt: profile.updatedAt.getTime(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        errorCode: 500,
        message: "プロフィール作成中にエラーが発生しました",
      },
    };
  }
};
