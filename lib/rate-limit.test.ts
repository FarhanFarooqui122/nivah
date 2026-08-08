import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit", () => {
    const key = "test:user1";
    for (let i = 0; i < 3; i++) {
      const result = rateLimit(key, 3, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2 - i);
    }
  });

  it("blocks requests beyond the limit", () => {
    const key = "test:user2";
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    const blocked = rateLimit(key, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after the window elapses", () => {
    const key = "test:user3";
    rateLimit(key, 1, 60_000);
    expect(rateLimit(key, 1, 60_000).allowed).toBe(false);

    vi.advanceTimersByTime(61_000);
    expect(rateLimit(key, 1, 60_000).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    rateLimit("test:a", 1, 60_000);
    expect(rateLimit("test:a", 1, 60_000).allowed).toBe(false);
    expect(rateLimit("test:b", 1, 60_000).allowed).toBe(true);
  });
});
