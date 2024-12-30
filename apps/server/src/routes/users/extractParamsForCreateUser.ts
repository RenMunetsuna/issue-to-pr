import type { CreateUserRequest } from './schema';

export const extractParamsForCreateUser = (request: { 
  body: CreateUserRequest['Body'] 
}) => {
  const { email, name, role } = request.body;

  if (!email || !name || !role) 
    return { success: false, error: { errorCode: 400 } };

  return {
    success: true,
    data: { email, name, role }
  };
};