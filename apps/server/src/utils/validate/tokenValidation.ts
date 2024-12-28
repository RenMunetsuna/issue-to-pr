import { IncomingMessage, ServerResponse } from 'http';
import {
  FastifyReply,
  FastifyRequest,
  RawServerDefault,
  preHandlerHookHandler
} from 'fastify';

/**
 * ユーザーを検証 (テスト用に常にtrue)
 */
export const verifyUser: preHandlerHookHandler<
  RawServerDefault,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  {
    Headers: { 'x-device-id'?: string; authorization?: string };
    Params?: { userId?: string };
  }
> = async (
  _request: FastifyRequest<{
    Headers: {
      'x-device-id'?: string;
    };
    Params?: { userId?: string };
  }>,
  _reply: FastifyReply
) => {
  return;
};

/**
 * デバイスIDの検証 (テスト用に常にtrue)
 */
const verifyDeviceId = async (_deviceId: string, _userId: string) => {
  return true;
};

/**
 * 匿名認証のトークンを検証 (テスト用に常にtrue)
 */
const verifyAnonymousToken = async (_token: string) => {
  return true;
};
