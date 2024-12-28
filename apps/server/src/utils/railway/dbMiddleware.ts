import { prisma } from '@/lib';
import type { Prisma } from '@/lib';

export const dbMiddleware =
  <CallbackInput extends { prisma: Prisma }, CallbackResult>(
    callback: (args: CallbackInput) => Promise<CallbackResult>
  ): ((args?: Omit<CallbackInput, 'prisma'>) => Promise<CallbackResult>) =>
  async (args) => {
    const argsWithPrisma = { ...args, prisma } as CallbackInput;
    return await callback(argsWithPrisma);
  };
