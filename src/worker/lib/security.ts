/**
 * Security utilities for input sanitization and validation
 */

// Basic HTML tag removal (more secure than regex for production)
export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove HTML tags, script tags, and other potentially dangerous content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
}

// Sanitize text content for safe storage and display
export function sanitizeText(input: string, maxLength: number = 1000): string {
  if (typeof input !== "string") {
    return "";
  }

  const sanitized = sanitizeHtml(input);
  return sanitized.slice(0, maxLength).trim();
}

// Validate and sanitize image prompts
export function sanitizePrompt(prompt: string): string {
  if (typeof prompt !== "string") {
    return "";
  }

  // Remove potential injection attempts and normalize
  const sanitized = prompt
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>\"']/g, "") // Remove potentially dangerous characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  return sanitized.slice(0, 1000); // Limit length
}

// Validate email format
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Validate handle/username format
export function isValidHandle(handle: string): boolean {
  if (typeof handle !== "string") {
    return false;
  }

  // Allow only alphanumeric characters, underscores, and hyphens
  // Length between 2-30 characters
  const handleRegex = /^[a-zA-Z0-9_-]{2,30}$/;
  return handleRegex.test(handle);
}

// Validate user name
export function isValidName(name: string): boolean {
  if (typeof name !== "string") {
    return false;
  }

  // Allow letters, numbers, spaces, and common punctuation
  // Length between 1-50 characters
  const nameRegex = /^[a-zA-Z0-9\s\-_.,']{1,50}$/;
  return nameRegex.test(name.trim()) && name.trim().length >= 1;
}

// Rate limiting key generation
export function generateRateLimitKey(
  type: "user" | "anon",
  identifier: string,
  window: string,
): string {
  if (type === "anon") {
    // For anonymous users, we should hash the IP for privacy
    return `rate_limit:anon:${identifier}:${window}`;
  }
  return `rate_limit:user:${identifier}:${window}`;
}

// Hash IP address for anonymous rate limiting
export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "ppoi-salt"); // Add salt for security
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Content Security Policy headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    // CSP for API responses (restrictive)
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none';",
  };
}

// Validate aspect ratio
export function isValidAspectRatio(aspectRatio: string): boolean {
  const validRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];
  return validRatios.includes(aspectRatio);
}

// Validate model quality setting
export function isValidQuality(quality: string): boolean {
  return quality === "fast" || quality === "quality";
}

// Validate numeric ranges
export function isValidGuidance(guidance: number): boolean {
  return typeof guidance === "number" && guidance >= 1 && guidance <= 30;
}

export function isValidSteps(steps: number): boolean {
  return typeof steps === "number" && steps >= 1 && steps <= 20;
}

export function isValidSeed(seed: number): boolean {
  return typeof seed === "number" && seed >= 0 && seed <= 2147483647;
}

// Check for suspicious patterns in prompts
export function containsSuspiciousContent(content: string): boolean {
  if (typeof content !== "string") {
    return true;
  }

  const suspiciousPatterns = [
    /\b(nude|naked|nsfw|explicit|sexual|porn)\b/i,
    /\b(violence|kill|death|blood|gore)\b/i,
    /\b(illegal|drug|weapon)\b/i,
    /<script|javascript:|data:text\/html/i,
    /\b(admin|administrator|root|system)\b/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(content));
}

// Sanitize tag names
export function sanitizeTag(tag: string): string {
  if (typeof tag !== "string") {
    return "";
  }

  return tag
    .toLowerCase()
    .replace(/[^a-z0-9\s\-_]/g, "") // Only allow alphanumeric, spaces, hyphens, underscores
    .replace(/\s+/g, " ") // Normalize spaces
    .trim()
    .slice(0, 30); // Limit length
}

// Validate tag array
export function validateTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map(sanitizeTag)
    .filter((tag) => tag.length >= 2) // Minimum length
    .slice(0, 10); // Maximum number of tags
}
