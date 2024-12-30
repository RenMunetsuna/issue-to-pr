import type { Prisma } from "@prisma/client";
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
  Result<CreateProfileResponse[200], { errorCode: 400 | 500; message?: string }>
> => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser)
      return {
        success: false,
        error: { errorCode: 400, message: "User not found" },
      };

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
        birthDate: profile.birthDate?.toISOString(),
        createdAt: profile.createdAt.getTime(),
        updatedAt: profile.updatedAt.getTime(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        errorCode: 500,
        message: "Failed to create profile",
      },
    };
  }
};
