import { FromSchema } from 'json-schema-to-ts';

export type GenerateRequestTypes<T> = (T extends { headers: object }
  ? { Headers: FromSchema<T['headers']> }
  : // eslint-disable-next-line @typescript-eslint/ban-types
    {}) &
  (T extends { body: object }
    ? { Body: FromSchema<T['body']> }
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {}) &
  (T extends { querystring: object }
    ? { Querystring: FromSchema<T['querystring']> }
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {}) &
  (T extends { params: object }
    ? { Params: FromSchema<T['params']> }
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {});
