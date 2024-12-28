import { join } from 'path';
import autoLoad from '@fastify/autoload';
import type { FastifyInstance } from 'fastify';

export default async (fastify: FastifyInstance) => {
  /* eslint-disable-next-line functional/no-expression-statements */
  await fastify.register(autoLoad, {
    dir: join(__dirname, '../../routes'),
    routeParams: true,
    matchFilter: (path: string) =>
      path.split('/').at(-1)?.split('.').at(-2) === '_handlers'
  });
};
