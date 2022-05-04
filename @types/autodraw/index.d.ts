type Arg = { x: number, y: number }[][]

declare module 'autodraw' {
  export default function autodraw(arg1: Arg): Promise<Record<string, any>[]>
}