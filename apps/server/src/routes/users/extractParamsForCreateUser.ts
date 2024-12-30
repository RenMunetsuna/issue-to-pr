import type { CreateUserRequest } from "./schema";

export const extractParamsForCreateUser = (request: {
  body: CreateUserRequest["body"];
}) => {
  const { email, name, role } = request.body;

  if (!email)
    return {
      success: false,
      error: { errorCode: 600, message: "メールアドレスは必須です" },
    };

  if (!name)
    return {
      success: false,
      error: { errorCode: 601, message: "名前は必須です" },
    };

  return {
    success: true,
    data: {
      email,
      name,
      role: role ?? "USER",
    },
  };
};
