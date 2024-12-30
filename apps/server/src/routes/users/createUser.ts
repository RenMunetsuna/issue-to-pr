import type { Prisma } from "@/lib";
import type { Result } from "@/types";
import type { CreateUserResponse } from "./schema";

export const createUserInDB = async ({
  email,
  name,
  role,
  prisma,
}: {
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  prisma: Prisma;
}): Promise<Result<CreateUserResponse[201], { errorCode: 610 | 620 }>> => {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) return { success: false, error: { errorCode: 610 } };

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.getTime(),
      },
    };
  } catch (error) {
    return { success: false, error: { errorCode: 620 } };
  }
};
