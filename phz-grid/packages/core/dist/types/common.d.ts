/**
 * @phozart/core — Common Types
 */
export interface CSSProperties {
    [key: string]: string | number | undefined;
}
export type Unsubscribe = () => void;
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
export type ExtractRowData<T> = T extends {
    __id: infer _ID;
} ? T : never;
export type PartialDeep<T> = {
    [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};
export type UserRole = 'viewer' | 'user' | 'editor' | 'admin';
//# sourceMappingURL=common.d.ts.map