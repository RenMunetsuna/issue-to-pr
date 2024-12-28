import type { Failure } from './Failure';

export type Result<Ok, Ng extends Failure> =
  | {
      success: true;
      data: Ok;
    }
  | {
      success: false;
      error: Ng;
    };
