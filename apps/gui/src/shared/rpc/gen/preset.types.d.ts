// AUTO-GENERATED FILE. DO NOT EDIT.
// Declaration-only types for generated RPC clients

export type list_Payload = void;
export type list_Result = import('zod').infer<
  (typeof import('../contracts/preset.contract').PresetContract)['methods']['list']['response']
>;

export type get_Payload = import('zod').infer<
  (typeof import('../contracts/preset.contract').PresetContract)['methods']['get']['payload']
>;
export type get_Result = import('zod').infer<
  (typeof import('../contracts/preset.contract').PresetContract)['methods']['get']['response']
>;

export type create_Payload = import('zod').infer<
  (typeof import('../contracts/preset.contract').PresetContract)['methods']['create']['payload']
>;
export type create_Result = import('zod').infer<
  (typeof import('../contracts/preset.contract').PresetContract)['methods']['create']['response']
>;

export type update_Payload = import('zod').infer<
  (typeof import('../contracts/preset.contract').PresetContract)['methods']['update']['payload']
>;
export type update_Result = import('zod').infer<
  (typeof import('../contracts/preset.contract').PresetContract)['methods']['update']['response']
>;

export type delete_Payload = import('zod').infer<
  (typeof import('../contracts/preset.contract').PresetContract)['methods']['delete']['payload']
>;
export type delete_Result = import('zod').infer<
  (typeof import('../contracts/preset.contract').PresetContract)['methods']['delete']['response']
>;
