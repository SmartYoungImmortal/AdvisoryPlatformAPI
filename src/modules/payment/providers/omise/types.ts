export const CustomerIdPrefix = 'cust';
export const TokenIdPrefix = 'tokn';
export const CardIdPrefix = 'card';
export const ChargeIdPrefix = 'chrg';

export type CustomerId = `${typeof CustomerIdPrefix}_${string}`;
export type TokenId = `${typeof TokenIdPrefix}_${string}`;
export type CardId = `${typeof CardIdPrefix}_${string}`;
export type ChargeId = `${typeof ChargeIdPrefix}_${string}`;
