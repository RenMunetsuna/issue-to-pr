/* eslint-disable functional/no-return-void, functional/no-expression-statements */
import fs from 'fs';
import helmet from '@fastify/helmet';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastify from 'fastify';
import fastifyAutoLoad from '@/utils/railway/fastifyAutoLoad';

// CI/CD検証用コメント

const PORT = 8080;
const HOST = '0.0.0.0';

const server = fastify();

// タグごとにopenapi.yamlを分割する際に指定
const opneapiTags = ['user', 'admin'];

const init = async ({ host, port }: { host: string; port: number }) => {
  await server.register(fastifyAutoLoad);
  await server.register(helmet, {
    global: true,
    noSniff: true // X-Content-Type-Options: nosniff を有効にする
  });

  await server.ready();

  // 開発環境のみ、openapi.yamlを出力
  (process.env['NODE_ENV'] ?? '') === 'development' &&
    (await Promise.all(
      opneapiTags.map(async (openapiTag) => {
        try {
          await generateOpenapiYaml(openapiTag);
        } catch (error) {
          console.error(error);
          process.exit(1);
        }
      })
    ));

  server.listen({ host, port }, (err: Error | null, address: string) => {
    if (err != null) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
};

const generateOpenapiYaml = async (tag: string) => {
  const tempFastify = fastify();

  await tempFastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'test swagger',
        description: 'test swagger',
        version: '1.0.0'
      }
    }
  });

  await tempFastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    transformSpecification: (
      swaggerObject: Readonly<Record<string, unknown>>
    ) => {
      // 指定したtagにマッチするAPIのみ取得
      const filteredPaths = Object.fromEntries(
        Object.entries(swaggerObject['paths'] as Record<string, unknown>)
          .filter(([, pathItem]) => {
            return Object.values(pathItem as Record<string, unknown>).some(
              (operation) => {
                const typedOperation = operation as Record<string, unknown>;
                return (
                  Array.isArray(typedOperation['tags']) &&
                  typedOperation['tags'].includes(tag)
                );
              }
            );
          })
          // Path順にソート
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      );

      return {
        ...swaggerObject,
        paths: filteredPaths
      };
    }
  });
  await tempFastify.register(fastifyAutoLoad);

  await tempFastify.ready();
  tempFastify.swagger();

  // openapi.ymlの生成
  const responseYaml = await tempFastify.inject('/docs/yaml');
  if (responseYaml.statusCode !== 200) {
    throw new Error(JSON.parse(responseYaml.payload).message);
  }
  fs.writeFileSync(`docs/openapi-for-${tag}.yaml`, responseYaml.payload);
};

init({ host: HOST, port: PORT });
