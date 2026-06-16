import assert from "node:assert/strict";
import test from "node:test";

import { canAccessSection, getNavigationItemsForRole } from "./access-policy";

test("client cannot access admin-only settings", () => {
  assert.equal(canAccessSection("CLIENT", "settings"), false);
  assert.equal(canAccessSection("ADMIN", "settings"), true);
});

test("consultant sees only allowed navigation items", () => {
  const consultantItems = getNavigationItemsForRole("CONSULTANT");
  const labels = consultantItems.map((item) => item.label);

  assert.equal(labels.includes("Configurações"), false);
  assert.equal(labels.includes("Empresas"), true);
  assert.equal(labels.includes("Auditorias"), true);
});
