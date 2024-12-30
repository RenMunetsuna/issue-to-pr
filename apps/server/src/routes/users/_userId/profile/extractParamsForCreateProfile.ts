import type { FastifyRequest } from "fastify";
import type { Result } from "@/types";
import type { CreateProfileRequest } from "./schema";

type ExtractResult = Result<
  CreateProfileRequest["Body"] & { userId: string },
  { errorCode: 400 }
>;

export const extractParamsForCreateProfile = (
  request: FastifyRequest<CreateProfileRequest>,
): ExtractResult => {
  const { bio, avatar, birthDate, location } = request.body;
  const { userId } = request.params;

  if (!bio || !avatar || !birthDate || !location)
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
