import type { CreateProfileRequest } from "./schema";

export const extractParamsForCreateProfile = (
  request: CreateProfileRequest,
) => {
  const { bio, avatar, birthDate, location } = request.body;
  const { userId } = request.params;

  return {
    userId,
    bio,
    avatar,
    birthDate,
    location,
  };
};
