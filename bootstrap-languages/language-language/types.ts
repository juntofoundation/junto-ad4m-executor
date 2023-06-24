import { ExpressionGeneric } from "@perspect3vism/ad4m";

export type EntryHash = Uint8Array;

export class LanguageMetadata {
  name: string;
  description: string;
  address: string;
  size: number;
  chunks_hashes: Array<EntryHash>;
}


export class LanguageExpression extends ExpressionGeneric(LanguageMetadata) {} ;