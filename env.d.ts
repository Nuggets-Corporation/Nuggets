/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly replacement: string | '';
  readonly wispUrl: string | 'default';
  readonly prefix: string | '';
  theme: string | 'default';
  proxy: string | 'scramjet';
  transport: string | 'epoxy';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const routeQuery: any;
declare const wispVal: any;
declare const prefix: any;