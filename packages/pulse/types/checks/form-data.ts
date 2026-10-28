/**
 * Type tests: compiled by `npm run typecheck`, never run. They check the declarations against how
 * the implementation behaves, which compiling the .d.ts files alone cannot.
 */
import type { RequestContext, FormValue } from '../schema.js'

declare const ctx: RequestContext

export async function formDataValuesAreNotJustStrings() {
  const data = await ctx.formData()
  const email = data?.email

  // A repeated field arrives as an array (a checkbox group, a multi-select) and a multipart file
  // part is an object, so a value cannot be used as a string without narrowing. If formData() went
  // back to Record<string, string>, this line would stop being an error and fail the typecheck.
  // @ts-expect-error
  email.trim()

  if (typeof email === 'string') email.trim()
  const asList: FormValue[] = Array.isArray(email) ? email : email === undefined ? [] : [email]
  return asList
}
