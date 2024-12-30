import type { CreateProfileRequest } from "./schema";

export const extractParamsForCreateProfile = (
  request: CreateProfileRequest,
) => {
  const { userId } = request.params;
  const { bio, avatar, birthDate, location } = request.body;

  // パラメータの検証
  if (!userId)
    return {
      success: false,
      error: { errorCode: 400, message: "ユーザーIDが必要です" },
    };

  if (!bio || !avatar || !birthDate || !location)
    return {
      success: false,
      error: { errorCode: 400, message: "全てのフィールドは必須です" },
    };

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
