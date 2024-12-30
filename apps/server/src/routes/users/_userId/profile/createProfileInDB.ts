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
  birthDate: string;
  location: string;
  prisma: Prisma;
}): Promise<
  Result<CreateProfileResponse[200], { errorCode: 600 | 610 | 620 | 800 }>
> => {
  try {
    // ユーザーの存在チェック
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user == null) return { success: false, error: { errorCode: 600 } };

    // すでにプロフィールが存在する場合はエラー
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile != null)
      return { success: false, error: { errorCode: 610 } };

    // プロフィール作成
    const profile = await prisma.profile.create({
      data: {
        bio,
        avatar,
        birthDate: new Date(birthDate),
        location,
        userId,
      },
    });

    return {
      success: true,
      data: {
        id: profile.id,
        bio: profile.bio ?? "",
        avatar: profile.avatar ?? "",
        birthDate: profile.birthDate?.toISOString() ?? "",
        location: profile.location ?? "",
        userId: profile.userId,
        createdAt: profile.createdAt.getTime(),
        updatedAt: profile.updatedAt.getTime(),
      },
    };
  } catch (error) {
    return { success: false, error: { errorCode: 620 } };
  }
};
