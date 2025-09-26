import { describe, it, expect } from "vitest";
import {
  sanitizeHtml,
  sanitizeText,
  sanitizePrompt,
  isValidEmail,
  isValidHandle,
  isValidName,
  isValidAspectRatio,
  isValidQuality,
  isValidGuidance,
  isValidSteps,
  isValidSeed,
  containsSuspiciousContent,
  sanitizeTag,
  validateTags,
} from "@/worker/lib/security";

describe("Security Utilities", () => {
  describe("sanitizeHtml", () => {
    it("should remove HTML tags", () => {
      expect(sanitizeHtml('<script>alert("xss")</script>Hello')).toBe("Hello");
      expect(sanitizeHtml('<div class="test">Content</div>')).toBe("Content");
    });

    it("should remove script tags completely", () => {
      expect(sanitizeHtml("Before<script>malicious()</script>After")).toBe(
        "BeforeAfter",
      );
    });

    it("should remove javascript: URLs", () => {
      expect(sanitizeHtml("javascript:alert(1)")).toBe("alert(1)");
    });

    it("should remove event handlers", () => {
      expect(sanitizeHtml('onclick="alert(1)" text')).toBe(" text");
    });

    it("should handle non-string input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizeHtml(null as any)).toBe("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizeHtml(undefined as any)).toBe("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizeHtml(123 as any)).toBe("");
    });

    it("should trim whitespace", () => {
      expect(sanitizeHtml("  <p>test</p>  ")).toBe("test");
    });
  });

  describe("sanitizeText", () => {
    it("should sanitize and limit text length", () => {
      const longText = "a".repeat(2000);
      const result = sanitizeText(longText, 100);
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it("should use default max length", () => {
      const longText = "a".repeat(2000);
      const result = sanitizeText(longText);
      expect(result.length).toBeLessThanOrEqual(1000);
    });

    it("should handle HTML in text", () => {
      expect(sanitizeText("<b>Bold</b> text")).toBe("Bold text");
    });
  });

  describe("sanitizePrompt", () => {
    it("should sanitize prompt text", () => {
      expect(
        sanitizePrompt("anime girl with <script>alert(1)</script> blue hair"),
      ).toBe("anime girl with  blue hair");
    });

    it("should remove dangerous characters", () => {
      expect(sanitizePrompt("test\"prompt'with<>quotes")).toBe(
        "testpromptwithquotes",
      );
    });

    it("should normalize whitespace", () => {
      expect(sanitizePrompt("text   with    spaces")).toBe("text with spaces");
    });

    it("should limit length", () => {
      const longPrompt = "a".repeat(2000);
      expect(sanitizePrompt(longPrompt).length).toBeLessThanOrEqual(1000);
    });

    it("should handle non-string input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizePrompt(null as any)).toBe("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizePrompt(123 as any)).toBe("");
    });
  });

  describe("isValidEmail", () => {
    it("should validate correct email formats", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user+tag@domain.co.uk")).toBe(true);
      expect(isValidEmail("firstname.lastname@company.org")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("user@domain")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });

    it("should handle non-string input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidEmail(null as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidEmail(123 as any)).toBe(false);
    });

    it("should reject overly long emails", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe("isValidHandle", () => {
    it("should validate correct handle formats", () => {
      expect(isValidHandle("user123")).toBe(true);
      expect(isValidHandle("test_user")).toBe(true);
      expect(isValidHandle("user-name")).toBe(true);
      expect(isValidHandle("a1")).toBe(true);
    });

    it("should reject invalid handle formats", () => {
      expect(isValidHandle("a")).toBe(false); // too short
      expect(isValidHandle("a".repeat(31))).toBe(false); // too long
      expect(isValidHandle("user@name")).toBe(false); // invalid character
      expect(isValidHandle("user name")).toBe(false); // space
      expect(isValidHandle("user.name")).toBe(false); // period
      expect(isValidHandle("")).toBe(false);
    });

    it("should handle non-string input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidHandle(null as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidHandle(123 as any)).toBe(false);
    });
  });

  describe("isValidName", () => {
    it("should validate correct name formats", () => {
      expect(isValidName("John Doe")).toBe(true);
      expect(isValidName("Mary-Jane")).toBe(true);
      expect(isValidName("O'Connor")).toBe(true);
      expect(isValidName("User123")).toBe(true);
    });

    it("should reject invalid names", () => {
      expect(isValidName("")).toBe(false);
      expect(isValidName("   ")).toBe(false); // only spaces
      expect(isValidName("a".repeat(51))).toBe(false); // too long
      expect(isValidName("user@name")).toBe(false); // invalid character
    });

    it("should handle non-string input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidName(null as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidName(123 as any)).toBe(false);
    });
  });

  describe("validation functions", () => {
    it("should validate aspect ratios", () => {
      expect(isValidAspectRatio("1:1")).toBe(true);
      expect(isValidAspectRatio("16:9")).toBe(true);
      expect(isValidAspectRatio("invalid")).toBe(false);
    });

    it("should validate quality settings", () => {
      expect(isValidQuality("fast")).toBe(true);
      expect(isValidQuality("quality")).toBe(true);
      expect(isValidQuality("invalid")).toBe(false);
    });

    it("should validate guidance values", () => {
      expect(isValidGuidance(7.5)).toBe(true);
      expect(isValidGuidance(1)).toBe(true);
      expect(isValidGuidance(30)).toBe(true);
      expect(isValidGuidance(0)).toBe(false);
      expect(isValidGuidance(31)).toBe(false);
    });

    it("should validate steps values", () => {
      expect(isValidSteps(20)).toBe(true);
      expect(isValidSteps(1)).toBe(true);
      expect(isValidSteps(50)).toBe(true);
      expect(isValidSteps(0)).toBe(false);
      expect(isValidSteps(51)).toBe(false);
    });

    it("should validate seed values", () => {
      expect(isValidSeed(12345)).toBe(true);
      expect(isValidSeed(0)).toBe(true);
      expect(isValidSeed(2147483647)).toBe(true);
      expect(isValidSeed(-1)).toBe(false);
      expect(isValidSeed(2147483648)).toBe(false);
    });
  });

  describe("containsSuspiciousContent", () => {
    it("should detect suspicious patterns", () => {
      expect(containsSuspiciousContent("nude anime girl")).toBe(true);
      expect(containsSuspiciousContent("violent content with blood")).toBe(
        true,
      );
      expect(containsSuspiciousContent("illegal drug content")).toBe(true);
      expect(containsSuspiciousContent("<script>alert(1)</script>")).toBe(true);
      expect(containsSuspiciousContent("admin privileges")).toBe(true);
    });

    it("should allow safe content", () => {
      expect(containsSuspiciousContent("cute anime girl with blue hair")).toBe(
        false,
      );
      expect(containsSuspiciousContent("magical fantasy artwork")).toBe(false);
      expect(containsSuspiciousContent("colorful landscape painting")).toBe(
        false,
      );
    });

    it("should handle non-string input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(containsSuspiciousContent(null as any)).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(containsSuspiciousContent(123 as any)).toBe(true);
    });
  });

  describe("sanitizeTag", () => {
    it("should sanitize tag names", () => {
      expect(sanitizeTag("Anime Girl")).toBe("anime girl");
      expect(sanitizeTag("tag-name_123")).toBe("tag-name_123");
    });

    it("should remove invalid characters", () => {
      expect(sanitizeTag("tag@#$%")).toBe("tag");
      expect(sanitizeTag("tag!with!symbols")).toBe("tagwithsymbols");
    });

    it("should normalize spaces and limit length", () => {
      expect(sanitizeTag("tag   with   spaces")).toBe("tag with spaces");
      expect(sanitizeTag("a".repeat(50))).toBe("a".repeat(30));
    });

    it("should handle non-string input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizeTag(null as any)).toBe("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizeTag(123 as any)).toBe("");
    });
  });

  describe("validateTags", () => {
    it("should validate and sanitize tag arrays", () => {
      const tags = ["Anime", "Girl!", "  blue hair  ", "a"];
      const result = validateTags(tags);
      expect(result).toEqual(["anime", "girl", "blue hair"]);
    });

    it("should limit number of tags", () => {
      const tags = Array.from({ length: 15 }, (_, i) => `tag${i}`);
      const result = validateTags(tags);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it("should filter out short tags", () => {
      const tags = ["a", "ab", "abc"];
      const result = validateTags(tags);
      expect(result).toEqual(["abc"]);
    });

    it("should handle non-array input", () => {
      expect(validateTags(null)).toEqual([]);
      expect(validateTags("not an array")).toEqual([]);
      expect(validateTags(123)).toEqual([]);
    });

    it("should filter out non-string items", () => {
      const tags = ["valid", 123, null, "another valid", undefined];
      const result = validateTags(tags);
      expect(result).toEqual(["valid", "another valid"]);
    });
  });
});
