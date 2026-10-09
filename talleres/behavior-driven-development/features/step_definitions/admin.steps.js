import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

Given("I am on the admin sign in page", async function () {
  await this.page.goto(this.url("/admin/login"));
});

When("I sign in as {string} with password {string}", async function (email, password) {
  await this.page.locator('input[name="email"]').fill(email);
  await this.page.locator('input[name="password"]').fill(password);
  await this.page.getByRole("button", { name: "Sign in" }).click();
});

Then("I see the admin dashboard", async function () {
  await expect(this.page).toHaveURL(this.url("/admin"));
  await expect(this.page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

Then("I see the message {string}", async function (message) {
  await expect(this.page.getByText(message)).toBeVisible();
});

Then("I stay on the sign in page", async function () {
  await expect(this.page).toHaveURL(this.url("/admin/login"));
});
