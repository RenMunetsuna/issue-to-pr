import { Role } from '@prisma/client';
import { buildApp } from '@/app';
import { testPrisma } from '@/lib';
import { generateAccessToken } from '@/utils/auth';

const app = buildApp();

describe('/app/user POST', () => {
  const email = 'test@example.com';
  const name = 'John Doe';
  const role = Role.USER;
  const accessToken = generateAccessToken({ userId: 'test-user' });

  afterEach(async () => {
    await testPrisma.user.deleteMany();
  });

  test('正常系 - ユーザー作成成功', async () => {