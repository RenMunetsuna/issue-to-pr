import type { CreateProfileRequest } from "./schema";

export const extractParamsForCreateProfile = (request: {
  headers: CreateProfileRequest["Headers"];
  params: CreateProfileRequest["Params"];
  body: CreateProfileRequest["Body"];
}) => {
  const { userId } = request.params;
  const { bio, avatar, birthDate, location } = request.body;

  return {
    userId,
    data: {
      bio,
      avatar,
      birthDate: new Date(birthDate),
      location,
    },
  };
};
