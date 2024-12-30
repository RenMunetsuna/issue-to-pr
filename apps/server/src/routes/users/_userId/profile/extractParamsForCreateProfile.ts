import type { CreateProfileRequest } from "./schema";
import type { Result } from "@/types";

export const extractParamsForCreateProfile = (
  request: CreateProfileRequest,
): Result<{
  userId: string;
  bio: string;
  avatar: string;
  birthDate: string;
  location: string;
}> => {
  const { userId } = request.params;
  const { bio, avatar, birthDate, location } = request.body;

  if (!userId || !bio || !avatar || !birthDate || !location)
    return { success: false, error: { errorCode: 400 } };

  return {
    success: true,
    data: {
      userId,
      bio,
      avatar,
      birthDate,
      location,
    },
  };
};
