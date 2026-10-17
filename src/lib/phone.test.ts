import { describe, expect, it } from "vitest";
import { formatPhone } from "./phone";

describe("formatPhone", () => {
  it("groups Philippine mobile numbers", () => {
    expect(formatPhone("+639171234567")).toBe("+63 917 123 4567");
  });

  it("leaves other numbers as stored", () => {
    expect(formatPhone("+14155552671")).toBe("+14155552671");
    expect(formatPhone("+63281234567")).toBe("+63281234567"); // Manila landline
    expect(formatPhone("")).toBe("");
  });
});
