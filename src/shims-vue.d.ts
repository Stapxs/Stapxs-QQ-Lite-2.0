/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.txt' {
  const str: string
  export default str
}

declare interface Window {
  moYu: any;
}
