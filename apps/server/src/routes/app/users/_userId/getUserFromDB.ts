import type { Prisma } from '@/lib';
import type { Result } from '@/types';
import type { GetUserResponse } from './schema';

export const getUserFromDB = async ({
  userId,
  prisma
}: {
  userId: string;
  prisma: Prisma;
}): Promise<Result<GetUserResponse[200], { errorCode: 600 }>> => {
  try {
    // ユーザー情報、プロフィール、コメントを一度に取得
    const user = await prisma.user.findUnique({
      relationLoadStrategy: 'join',
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        profile: {
          select: {
            bio: true,
            avatar: true,
            birthDate: true,
            location: true
          }
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (user == null) return { success: false, error: { errorCode: 600 } };

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: {
          bio: user.profile?.bio ?? null,
          avatar: user.profile?.avatar ?? null,
          birthDate: user.profile?.birthDate?.toISOString() ?? null,
          location: user.profile?.location ?? null
        },
        comments: user.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.getTime()
        })),
        createdAt: user.createdAt.getTime()
      }
    };
  } catch (error) {
    return { success: false, error: { errorCode: 600 } };
  }
};
