import type { JSONSchema } from "json-schema-to-ts";
import type { GenerateRequestTypes, GenerateResponseTypes } from "@/types";
import { UserStatus } from "@prisma/client";

export const schemas = {
  post: {
    tags: ["user"],
    description: "ユーザープロフィール登録",
    params: {
      type: "object",
      properties: {
        userId: { type: "string" },
      },
      required: ["userId"],
    } as const satisfies JSONSchema,
    headers: {
      type: "object",
      properties: {
        authorization: { type: "string" },
        "x-device-id": { type: "string" },
      },
      required: ["authorization", "x-device-id"],
    } as const satisfies JSONSchema,
    body: {
      type: "object",
      properties: {
        bio: { type: "string" },
        avatar: { type: "string" },
        birthDate: { type: "string", format: "date" },
        location: { type: "string" },
      },
      required: ["bio", "avatar", "birthDate", "location"],
    } as const satisfies JSONSchema,
    response: {
      200: {
        type: "object",
        properties: {
          id: { type: "string" },
          bio: { type: "string" },
          avatar: { type: "string" },
          birthDate: { type: "string" },
          location: { type: "string" },
          userId: { type: "string" },
          createdAt: { type: "number" },
          updatedAt: { type: "number" },
        },
        required: [
          "id",
          "bio",
          "avatar",
          "birthDate",
          "location",
          "userId",
          "createdAt",
          "updatedAt",
        ],
      } as const satisfies JSONSchema,
      400: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
        required: ["error"],
      } as const satisfies JSONSchema,
      404: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
        required: ["error"],
      } as const satisfies JSONSchema,
      500: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
        required: ["error"],
      } as const satisfies JSONSchema,
    },
  },
};

export type CreateProfileRequest = GenerateRequestTypes<typeof schemas.post>;
export type CreateProfileResponse = GenerateResponseTypes<
  typeof schemas.post.response
>;
