import { z } from "zod";
import {
  validateIdentifier,
  type IdentifierErrorCode
} from "@/lib/identifiers";

/**
 * UIで使用しているSQL識別子バリデーションと同一ルールを再利用するための共通関数。
 *
 * - skipEmpty=false: 空は不正
 * - skipEmpty=true: 空は許容（オプション入力用）
 */
export function sqlIdentifierError(
  value: string,
  skipEmpty = false
): IdentifierErrorCode | null {
  return validateIdentifier(value, skipEmpty);
}

export function sqlIdentifierSchema(skipEmpty = false) {
  return z
    .string()
    .superRefine((val, ctx) => {
      const err = sqlIdentifierError(val, skipEmpty);
      if (!err) return;
      // message に errorCode を載せる（import側で path と一緒に表示可能）
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err
      });
    });
}

