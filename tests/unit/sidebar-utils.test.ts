import { describe, expect, it } from "vitest";
import { isNavLinkActive } from "@/components/layout/sidebar-utils";

describe("sidebar utils", () => {
  it("keeps library link active on create course page", () => {
    expect(isNavLinkActive("/manager/courses/new", "/manager/courses")).toBe(true);
  });

  it("activates nested pages for non-library links", () => {
    expect(isNavLinkActive("/manager/reports/monthly", "/manager/reports")).toBe(true);
  });
});
