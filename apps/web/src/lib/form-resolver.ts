/**
 * Tiny Zod → React Hook Form resolver.
 * @hookform/resolvers is not installed; this is the same contract the
 * JoinList form already used in Phase 4, extracted so every form
 * shares it (checkout, reservation, contact).
 *
 * `messages` lets a form keep the ONE shared schema (server + client)
 * while showing validation errors in the page locale: when a message
 * is provided for a field it replaces the schema's (English) message.
 */
import type { FieldError, FieldErrors, Resolver, ResolverResult } from "react-hook-form";
import type { z } from "zod";

export function zodResolver<T extends Record<string, unknown>>(
  schema: z.ZodType<T>,
  messages?: Partial<Record<keyof T, string>>,
): Resolver<T> {
  return (async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      const success: ResolverResult<T> = { values: result.data, errors: {} };
      return success;
    }
    // Build as a plain record first: FieldErrors<T> is a mapped type
    // that cannot be indexed with a generic keyof T.
    const errors: Record<string, FieldError> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !errors[field]) {
        errors[field] = {
          type: "validation",
          message: messages?.[field as keyof T] ?? issue.message,
        };
      }
    }
    const failure: ResolverResult<T> = { values: {}, errors: errors as FieldErrors<T> };
    return failure;
  }) as Resolver<T>;
}
