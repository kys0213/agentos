// AUTO-GENERATED FILE. DO NOT EDIT.
// Declaration-only types for generated RPC clients

export type listSessions_Payload = import('zod').infer<
  (typeof import('../contracts/chat.contract').ChatContract)['methods']['listSessions']['payload']
>;
export type listSessions_Result = import('zod').infer<
  (typeof import('../contracts/chat.contract').ChatContract)['methods']['listSessions']['response']
>;

export type getMessages_Payload = import('zod').infer<
  (typeof import('../contracts/chat.contract').ChatContract)['methods']['getMessages']['payload']
>;
export type getMessages_Result = import('zod').infer<
  (typeof import('../contracts/chat.contract').ChatContract)['methods']['getMessages']['response']
>;

export type deleteSession_Payload = import('zod').infer<
  (typeof import('../contracts/chat.contract').ChatContract)['methods']['deleteSession']['payload']
>;
export type deleteSession_Result = import('zod').infer<
  (typeof import('../contracts/chat.contract').ChatContract)['methods']['deleteSession']['response']
>;
