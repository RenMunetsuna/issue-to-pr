import type { FastifyRequest } from "fastify";
import type { Result } from "@/types";
import type { CreateProfileRequest } from "./schema";

export const extractParamsForCreateProfile = (
  request: FastifyRequest<{
    Params: CreateProfileRequest["Params"];
    Body: CreateProfileRequest["Body"];
  }>,
): Result<
  {
    userId: string;
    bio: string;
    avatar: string;
    birthDate: string;
    location: string;
  },
  { errorCode: 400 }
> => {
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
