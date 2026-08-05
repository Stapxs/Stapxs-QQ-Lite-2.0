import { AllowedComponentProps, ExtractPropTypes, VNodeProps, ComponentPropsOptions, Component, VNode } from 'vue'

type Empty = Record<string, never>

type GetAllProps<T extends Component> = T extends new (...args: any) => { $props: infer P }
    ? P
    : T extends () => VNode
    ? object
    : T extends (props: infer P, ...args: any) => any
    ? P
    : T extends { props: infer P }
        ? (P extends ComponentPropsOptions ? ExtractPropTypes<P> : P)
        : any

type GetDefineProps<T extends Component> = GetAllProps<T> extends infer P & VNodeProps & AllowedComponentProps ? P : never

type GetModel<T extends Component> = GetDefineProps<T> extends infer P
    ? 'modelValue' extends keyof P ? P['modelValue'] : undefined
    : never

type GetEmit<T extends Component> = GetDefineProps<T> extends infer P ? {
    [
        Key in keyof P & string as Key extends `on${infer N}`
            ? N extends 'Update:ModelValue' ? never : Uncapitalize<N>
            : never
    ]: P[Key]
} : never

type GetProps<T extends Component> = GetDefineProps<T> extends infer P ? {
    [
        Key in keyof P & string as Key extends `on${Capitalize<string>}`
            ? never
            : `onUpdate:${Key}` extends keyof P
                ? never
                : Key
    ]: P[Key]
} : never

type GetEmitArgs<T extends Component> = GetEmit<T> extends infer E ? {
    [K in keyof E]?: E[K]
} : never

type SetOptional<O extends Record<string, unknown>, T> = {
    [K in keyof O as T extends O[K] ? K : never]?: O[K]
} & {
    [K in keyof O as T extends O[K] ? never : K]: O[K]
}

type CreateOptionalKey<K extends string, Content> = Content extends Record<string, unknown>
    ? SetOptional<Content, undefined> extends infer R
        ? Empty extends R
            ? Partial<Record<K, R>>
            : Record<K, R>
        : never
    : Content extends undefined
        ? Partial<Record<K, Content>>
        : Record<K, Content>

export type VueCompData<T extends Component> = {
    comp: T
    emit?: GetEmitArgs<T>
} & CreateOptionalKey<'model', GetModel<T>> & CreateOptionalKey<'props', GetProps<T>>
