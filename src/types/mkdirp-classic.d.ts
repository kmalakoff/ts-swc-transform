declare module 'mkdirp-classic' {
  function mkdirp(p: string, cb: (err: Error | null) => void): void;
  export = mkdirp;
}
