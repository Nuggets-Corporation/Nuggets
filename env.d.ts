/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly replacement: string | '';
  readonly wispUrl: string | 'default';
  theme: string | 'default';
  proxy: string | 'scramjet';
  transport: string | 'epoxy';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const routeQuery: any;
declare const wispVal: any;