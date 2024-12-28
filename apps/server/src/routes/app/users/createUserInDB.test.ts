import { Role } from '@prisma/client';
import { createUserInDB } from './createUserInDB';
import { testPrisma } from '@/lib';

const email = 'test@example.com';
const name = 'John Doe';
const role = Role.USER;

describe('createUserInDB', () => {
  afterEach(async () => {
    await testPrisma.user.deleteMany();
  });

  test('正常系 - ユーザー作成成功', async () => {
    const result = await createUserInDB({
      email,
      name,
      role,
      prisma: testPrisma
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id');
    expect(result.data.email).toBe(email);
    expect(result.data.name).toBe(name);
    expect(result.data.role).toBe(role);
  });

  test('異常系 - ユーザー重複エラー', async () => {
    // 既にユーザーを作成しておく
    await testPrisma.user.create({
      data: { email, name, role }
    });

    const result = await createUserInDB({
      email,
      name,
      role,
      prisma: testPrisma
    });

    expect(result.success).toBe(false);
    expect(result.error).toEqual({ errorCode: 600 });
  });

  test('異常系 - Prismaエラー', async () => {
    jest.spyOn(testPrisma.user, 'create').mockRejectedValue(new Error('DB Error'));

    const result = await createUserInDB({
      email,
      name,
      role,
      prisma: testPrisma
    });

    expect(result.success).toBe(false);
    expect(result.error).toEqual({ errorCode: 800 });
  });
});