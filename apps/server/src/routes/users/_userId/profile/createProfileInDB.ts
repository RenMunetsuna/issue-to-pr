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
}): Promise<Result<CreateProfileResponse[200], { errorCode: 600 | 800 }>> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user == null) return { success: false, error: { errorCode: 600 } };

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        bio,
        avatar,
        birthDate: new Date(birthDate),
        location,
      },
      create: {
        userId,
        bio,
        avatar,
        birthDate: new Date(birthDate),
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
        birthDate: profile.birthDate.toISOString(),
        createdAt: profile.createdAt.getTime(),
        updatedAt: profile.updatedAt.getTime(),
      },
    };
  } catch (error) {
    return { success: false, error: { errorCode: 800 } };
  }
};
