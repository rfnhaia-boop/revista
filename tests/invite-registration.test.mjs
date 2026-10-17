import assert from "node:assert/strict";
import test from "node:test";
import { inviteRegistrationSchema } from "../lib/auth-validation.ts";

test("invite registration requires matching passwords and consent", () => {
  const base = { token: "a".repeat(32), name: "Ana Silva", password: "segredo123", confirmPassword: "segredo123", consent: true };
  assert.equal(inviteRegistrationSchema.safeParse(base).success, true);
  assert.equal(inviteRegistrationSchema.safeParse({ ...base, confirmPassword: "outraSenha" }).success, false);
  assert.equal(inviteRegistrationSchema.safeParse({ ...base, consent: false }).success, false);
});
