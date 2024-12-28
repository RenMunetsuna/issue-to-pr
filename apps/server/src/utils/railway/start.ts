export const start = <Return>(
  result: Return | Promise<Return>
): (() => Promise<Return>) => {
  /* eslint-disable-next-line functional/functional-parameters */
  return async () => {
    return await result;
  };
};
