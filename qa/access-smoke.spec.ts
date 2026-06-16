import { expect, test, type Page } from "@playwright/test";

const adminLinks = [
  "Dashboard",
  "Empresas",
  "Auditorias",
  "Modelos de Checklist",
  "Nao Conformidades",
  "Planos de Acao",
  "Notificacoes",
  "Configuracoes",
];

const clientVisibleLinks = [
  "Dashboard",
  "Auditorias",
  "Nao Conformidades",
  "Planos de Acao",
  "Notificacoes",
];

const clientHiddenLinks = ["Empresas", "Modelos de Checklist", "Configuracoes"];

function navLinkName(label: string) {
  if (label === "Notificacoes") {
    return /^Notificacoes(?:\s+\d+)?$/;
  }

  return new RegExp(`^${label}$`);
}

async function login(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test.use({
  baseURL: "http://localhost:3000",
});

test("admin sees full navigation and can open core areas", async ({ page }) => {
  await login(page, "admin@atlas.local", "Admin@123");
  await page.waitForURL("**/dashboard");
  const sidebar = page.locator("aside");

  for (const link of adminLinks) {
    await expect(sidebar.getByRole("link", { name: navLinkName(link) })).toBeVisible();
  }

  await sidebar.getByRole("link", { name: "Empresas", exact: true }).click();
  await page.waitForURL("**/companies");
  await expect(page.getByRole("heading", { name: "Empresas" })).toBeVisible();

  await sidebar.getByRole("link", { name: "Auditorias", exact: true }).click();
  await page.waitForURL("**/audits");
  await expect(page.getByRole("heading", { name: "Auditorias" })).toBeVisible();

  await sidebar.getByRole("link", { name: "Modelos de Checklist", exact: true }).click();
  await page.waitForURL("**/checklists");
  await expect(page.getByRole("heading", { name: "Modelos de Checklist" })).toBeVisible();

  await sidebar.getByRole("link", { name: "Configuracoes", exact: true }).click();
  await page.waitForURL("**/settings");
  await expect(page.getByRole("heading", { name: /Configura/i })).toBeVisible();
});

test("client sees restricted navigation and is blocked from admin-only areas", async ({
  page,
}) => {
  await login(page, "cliente@atlas.local", "Cliente@123");
  await page.waitForURL("**/dashboard");
  const sidebar = page.locator("aside");

  for (const link of clientVisibleLinks) {
    await expect(sidebar.getByRole("link", { name: navLinkName(link) })).toBeVisible();
  }

  for (const link of clientHiddenLinks) {
    await expect(sidebar.getByRole("link", { name: link, exact: true })).toHaveCount(0);
  }

  await page.goto("/companies");
  await page.waitForURL("**/dashboard");

  await page.goto("/checklists");
  await page.waitForURL("**/dashboard");

  await page.goto("/settings");
  await page.waitForURL("**/dashboard");

  await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: "Notificacoes" })).toBeVisible();
});
