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
  bio?: string;
  avatar?: string;
  birthDate?: Date;
  location?: string;
  prisma: Prisma;
}): Promise<
  Result<CreateProfileResponse[200], { errorCode: 600 | 610 | 620 | 800 }>
> => {
  try {
    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user == null) return { success: false, error: { errorCode: 600 } };

    // プロフィールの作成または更新
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        ...(bio && { bio }),
        ...(avatar && { avatar }),
        ...(birthDate && { birthDate }),
        ...(location && { location }),
      },
      create: {
        userId,
        ...(bio && { bio }),
        ...(avatar && { avatar }),
        ...(birthDate && { birthDate }),
        ...(location && { location }),
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
        id: profile.id,
        bio: profile.bio,
        avatar: profile.avatar,
        birthDate: profile.birthDate?.toISOString(),
        location: profile.location,
        userId: profile.userId,
        createdAt: profile.createdAt.getTime(),
        updatedAt: profile.updatedAt.getTime(),
      },
    };
  } catch (error) {
    console.error("Error creating profile:", error);
    return { success: false, error: { errorCode: 620 } };
  }
};
