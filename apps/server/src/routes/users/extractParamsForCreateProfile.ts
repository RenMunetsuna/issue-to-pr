import type { CreateProfileRequest } from "./schema";

export const extractParamsForCreateProfile = (
  request: CreateProfileRequest,
) => {
  const { userId } = request.params;
  const { bio, avatar, birthDate, location } = request.body ?? {};

  if (!userId)
    return {
      success: false,
      error: { errorCode: 400, message: "User ID is required" },
    };

  return {
    success: true,
    data: {
      userId,
      bio,
      avatar,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      location,
    },
  };
};
