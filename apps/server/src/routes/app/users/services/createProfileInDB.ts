import type { Prisma } from '@/lib';
import type { Result } from '@/types';
import type { CreateProfileResponse } from './schema';

export const createProfileInDB = async ({
  userId,
  bio,
  avatar,
  birthDate,
  location,
  prisma
}: {
  userId: string;
  bio?: string;
  avatar?: string;
  birthDate?: Date;
  location?: string;
  prisma: Prisma;
}): Promise<Result<CreateProfileResponse[200], { errorCode: 600 | 630 }>> => {
  try {
    const existingProfile = await prisma.profile.findUnique({
      where: { userId }
    });

    if (existingProfile) {
      return { success: false, error: { errorCode: 600 } };
    }

    const newProfile = await prisma.profile.create({
      data: {
        userId,
        bio,
        avatar,
        birthDate,
        location
      }
    });

    return {
      success: true,
      data: {
        id: newProfile.id,
        userId: newProfile.userId,
        bio: newProfile.bio ?? null,
        avatar: newProfile.avatar ?? null,
        birthDate: newProfile.birthDate?.toISOString() ?? null,
        location: newProfile.location ?? null
      }
    };
  } catch (error) {
    return { success: false, error: { errorCode: 630 } };
  }
};