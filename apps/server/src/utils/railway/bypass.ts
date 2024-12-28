import type { Failure, Result } from '@/types';

export const bypass = <
  PreviousOk,
  PreviousNg extends Failure,
  NextOk,
  NextNg extends Failure
>(
  func: (
    i: PreviousOk
  ) => Result<NextOk, NextNg> | Promise<Result<NextOk, NextNg>>
): ((
  input: Promise<Result<PreviousOk, PreviousNg>>
) => Promise<Result<NextOk, PreviousNg | NextNg>>) => {
  return async (input) => {
    const inputResult = await input;
    return inputResult.success ? await func(inputResult.data) : inputResult;
  };
};
