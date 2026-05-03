/**
 * Phase 17 — Utility function tests
 */
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  formatCurrency,
  formatPhone,
  maskPhone,
  formatRole,
  formatStatus,
} from "../src/utils/format";

describe("formatFileSize", () => {
  it("returns bytes for < 1KB", () => expect(formatFileSize(512)).toBe("512 B"));
  it("returns KB for 1024–1M", () => expect(formatFileSize(2048)).toBe("2.0 KB"));
  it("returns MB for ≥ 1M", () => expect(formatFileSize(2_457_600)).toBe("2.3 MB"));
});

describe("formatCurrency", () => {
  it("formats Indian currency with ₹", () => {
    const result = formatCurrency(4500);
    expect(result).toContain("₹");
    expect(result).toContain("4");
  });
  it("includes decimal places", () => {
    expect(formatCurrency(100)).toContain(".00");
  });
});

describe("formatPhone", () => {
  it("formats +91 number with spaces", () => {
    const result = formatPhone("+919876543210");
    expect(result).toContain("+91");
    expect(result).toContain("43210");
  });
  it("returns other formats as-is for short numbers", () => {
    expect(formatPhone("+1234")).toBe("+1234");
  });
});

describe("maskPhone", () => {
  it("shows only last 5 digits", () => {
    const masked = maskPhone("+919876543210");
    expect(masked.endsWith("43210")).toBe(true);
    expect(masked).toContain("X");
  });
});

describe("formatRole", () => {
  it("converts COMMUNITY_ADMIN to Community Admin", () => {
    expect(formatRole("COMMUNITY_ADMIN")).toBe("Community Admin");
  });
  it("converts FM to Fm", () => {
    expect(formatRole("FM")).toBe("Fm");
  });
});

describe("formatStatus", () => {
  it("converts IN_PROGRESS to In Progress", () => {
    expect(formatStatus("IN_PROGRESS")).toBe("In Progress");
  });
  it("converts CHECKED_IN to Checked In", () => {
    expect(formatStatus("CHECKED_IN")).toBe("Checked In");
  });
});
