import type { Prisma } from "@/lib";
import type { Result } from "@/types";
import type { CreateProfileResponse } from "./schema";

export const createProfileInDB = async ({
  userId,
  data,
  prisma,
}: {
  userId: string;
  data: {
    bio: string;
    avatar: string;
    birthDate: Date;
    location: string;
  };
  prisma: Prisma;
}): Promise<
  Result<CreateProfileResponse[200], { errorCode: 600 | 610 | 800 }>
> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user == null) return { success: false, error: { errorCode: 600 } };

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        bio: data.bio,
        avatar: data.avatar,
        birthDate: data.birthDate,
        location: data.location,
      },
      create: {
        userId,
        bio: data.bio,
        avatar: data.avatar,
        birthDate: data.birthDate,
        location: data.location,
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
        birthDate: profile.birthDate.toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: { errorCode: 800 } };
  }
};
