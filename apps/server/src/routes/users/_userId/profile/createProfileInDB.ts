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
  Result<CreateProfileResponse[200], { errorCode: 600 | 610 | 800 }>
> => {
  try {
    // ユーザーの存在確認
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user == null) return { success: false, error: { errorCode: 600 } };

    // プロフィールが既に存在する場合は更新、存在しない場合は作成
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: { bio, avatar, birthDate, location },
      create: { userId, bio, avatar, birthDate, location },
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
        birthDate: profile.birthDate.toISOString(),
      },
    };
  } catch (error) {
    console.error("Profile creation error:", error);
    return { success: false, error: { errorCode: 800 } };
  }
};
