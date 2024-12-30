import type { CreateProfileRequest } from "./schema";

export const extractParamsForCreateProfile = (
  request: CreateProfileRequest,
) => {
  const { userId } = request.params;
  const { bio, avatar, birthDate, location } = request.body;

  if (!userId || !bio || !avatar || !birthDate || !location) {
    return {
      success: false,
      error: { errorCode: 400, message: "Invalid parameters" },
    };
  }

  return {
    success: true,
    data: {
      userId,
      bio,
      avatar,
      birthDate: new Date(birthDate),
      location,
    },
  };
};
