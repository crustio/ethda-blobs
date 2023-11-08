/* eslint-disable @typescript-eslint/no-explicit-any */
export function debug(message?: any, ...optionalParams: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(message, ...optionalParams);
  }
}
