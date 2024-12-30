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
  Result<CreateProfileResponse[200], { errorCode: 600 | 610 | 800 }>
> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user == null) return { success: false, error: { errorCode: 600 } };

    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile != null)
      return { success: false, error: { errorCode: 610 } };

    const profile = await prisma.profile.create({
      data: {
        userId,
        bio,
        avatar,
        birthDate: new Date(birthDate),
        location,
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
    return { success: false, error: { errorCode: 800 } };
  }
};
