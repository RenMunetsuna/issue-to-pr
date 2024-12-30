import { z } from "zod";

import type { CreateProfileRequest } from "./schema";

const paramsSchema = z.object({
  userId: z.string(),
});

const bodySchema = z.object({
  bio: z.string(),
  avatar: z.string(),
  birthDate: z.string().datetime(),
  location: z.string(),
});

type Params = z.infer<typeof paramsSchema>;
type Body = z.infer<typeof bodySchema>;

export const extractParamsForCreateProfile = (
  request: CreateProfileRequest,
): { params: Params; body: Body } | { error: string } => {
  const parsedParams = paramsSchema.safeParse(request.params);
  if (!parsedParams.success) return { error: "Invalid params" };

  const parsedBody = bodySchema.safeParse(request.body);
  if (!parsedBody.success) return { error: "Invalid body" };

  return { params: parsedParams.data, body: parsedBody.data };
};
