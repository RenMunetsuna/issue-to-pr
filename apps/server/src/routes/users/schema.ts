import type { JSONSchema } from "json-schema-to-ts";
import type { Role } from "@prisma/client";
import type { GenerateRequestTypes, GenerateResponseTypes } from "@/types";

export const schemas = {
  post: {
    tags: ["user"],
    description: "ユーザーを作成する",
    body: {
      type: "object",
      properties: {
        email: { type: "string", format: "email", maxLength: 255 },
        name: { type: "string", maxLength: 100 },
        role: {
          type: "string",
          enum: ["USER", "ADMIN"],
        },
      },
      required: ["email", "name", "role"],
    } as const satisfies JSONSchema,
    response: {
      201: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          role: {
            type: "string",
            enum: ["USER", "ADMIN"],
          },
          createdAt: { type: "number" },
        },
        required: ["id", "email", "name", "role", "createdAt"],
      } as const satisfies JSONSchema,
      400: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
        required: ["error"],
      } as const satisfies JSONSchema,
      409: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
        required: ["error"],
      } as const satisfies JSONSchema,
    },
  },
};

export type CreateUserRequest = GenerateRequestTypes<typeof schemas.post>;
export type CreateUserResponse = GenerateResponseTypes<
  typeof schemas.post.response
>;
