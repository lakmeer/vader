
//
// Misc
//
// Other small utility functions for various things
//

export const id = (x:any) => x;

export const error = (fn:string, ...args:any[]) => {
  throw new Error(`Vader::${fn} - ${args.join(' ')}`);
}

export const warn = (fn:string, ...args:any[]) => {
  console.warn(`Vader::${fn} - ${args.join(' ')}`);
}

export const isPowerOfTwo = (value:number) =>
  (value & (value - 1)) === 0;


