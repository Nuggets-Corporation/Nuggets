/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly replacement: string | '';
  readonly wispUrl: string | 'default';
  theme: string | 'default';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const routeQuery: any;
declare const wispVal: any;