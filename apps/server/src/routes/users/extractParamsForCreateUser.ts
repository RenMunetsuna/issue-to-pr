import type { CreateUserRequest } from "./schema";

export const extractParamsForCreateUser = (request: {
  body: CreateUserRequest["body"];
}) => {
  const { email, name, role } = request.body;

  if (!email || email.trim() === "")
    return {
      success: false,
      error: { errorCode: 600, message: "Invalid email" },
    };

  if (!name || name.trim() === "")
    return {
      success: false,
      error: { errorCode: 601, message: "Invalid name" },
    };

  if (!["USER", "ADMIN"].includes(role))
    return {
      success: false,
      error: { errorCode: 602, message: "Invalid role" },
    };

  return {
    success: true,
    data: { email, name, role },
  };
};
