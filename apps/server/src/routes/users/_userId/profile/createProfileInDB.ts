import type { Prisma } from "@/lib";
import type { Result } from "@/types";
import type { CreateProfileResponse } from "./schema";

// eslint-disable-next-line functional/no-expression-statements
/**
 * プロフィールを登録
 */
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
  Result<CreateProfileResponse[200], { errorCode: 600 | 610 | 620 }>
> => {
  try {
    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (user == null) return { success: false, error: { errorCode: 600 } };

    // プロフィールの重複確認
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });
    if (existingProfile != null)
      return { success: false, error: { errorCode: 610 } };

    // プロフィール登録
    const profile = await prisma.profile.create({
      data: {
        userId,
        bio,
        avatar,
        birthDate,
        location,
      },
    });

    return {
      success: true,
      data: {
        id: profile.id,
        bio: profile.bio ?? "",
        avatar: profile.avatar ?? "",
        birthDate: profile.birthDate,
        location: profile.location ?? "",
        userId: profile.userId,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    };
  } catch (error) {
    return { success: false, error: { errorCode: 620 } };
  }
};
