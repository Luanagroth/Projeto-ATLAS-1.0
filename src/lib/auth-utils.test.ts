import assert from "node:assert/strict";
import test from "node:test";

import { appRoles, hashPassword, isAppRole, normalizeEmail, verifyPassword } from "./auth-utils";

test("normalizeEmail trims spaces and lowercases input", () => {
  assert.equal(normalizeEmail("  ADMIN@Atlas.Local  "), "admin@atlas.local");
});

test("isAppRole accepts only supported roles", () => {
  for (const role of appRoles) {
    assert.equal(isAppRole(role), true);
  }

  assert.equal(isAppRole("MASTER"), false);
  assert.equal(isAppRole(null), false);
});

test("hashPassword and verifyPassword work together", async () => {
  const hash = await hashPassword("Atlas@123");

  assert.equal(await verifyPassword("Atlas@123", hash), true);
  assert.equal(await verifyPassword("SenhaErrada", hash), false);
});
