import { FromSchema } from 'json-schema-to-ts';

// Fastifyから返されうるステータスコード一覧
type StatusCodeList = 200 | 400 | 401 | 403 | 404 | 409 | 410 | 413 | 422 | 500;

// 各ステータスの型を抽出
type ExtractStatus<
  Response,
  StatusCode extends StatusCodeList
> = Response extends {
  [Key in `${StatusCode}`]: object;
}
  ? { [Key in StatusCode]: FromSchema<Response[`${StatusCode}`]> }
  : // eslint-disable-next-line @typescript-eslint/ban-types
    {};

// Fastifyから返されうるステータスコードのレスポンスを型定義
export type GenerateResponseTypes<Response> = ExtractStatus<Response, 200> &
  ExtractStatus<Response, 400> &
  ExtractStatus<Response, 401> &
  ExtractStatus<Response, 403> &
  ExtractStatus<Response, 413> &
  ExtractStatus<Response, 404> &
  ExtractStatus<Response, 409> &
  ExtractStatus<Response, 410> &
  ExtractStatus<Response, 422> &
  ExtractStatus<Response, 500>;
