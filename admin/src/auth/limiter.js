// In-memory brute-force protection: per-IP failures plus a global counter for
// the single admin account. Restarting the container resets the counters,
// which is acceptable because the password hash is deliberately slow.

export class LoginLimiter {
  constructor({ perIp = 5, ipWindowMs = 15 * 60_000, global = 20, globalWindowMs = 60 * 60_000 } = {}) {
    this.perIp = perIp;
    this.ipWindowMs = ipWindowMs;
    this.global = global;
    this.globalWindowMs = globalWindowMs;
    this.ips = new Map();
    this.globalFails = [];
  }

  #prune(now) {
    this.globalFails = this.globalFails.filter((t) => now - t < this.globalWindowMs);
    for (const [ip, times] of this.ips) {
      const kept = times.filter((t) => now - t < this.ipWindowMs);
      if (kept.length) this.ips.set(ip, kept);
      else this.ips.delete(ip);
    }
  }

  /** Returns seconds to wait, or 0 if an attempt is allowed. */
  retryAfter(ip, now = Date.now()) {
    this.#prune(now);
    const times = this.ips.get(ip) ?? [];
    if (times.length >= this.perIp) return Math.ceil((times[0] + this.ipWindowMs - now) / 1000);
    if (this.globalFails.length >= this.global) {
      // Escalating slowdown for the single account rather than a permanent lockout.
      return Math.min(900, 30 * (this.globalFails.length - this.global + 1));
    }
    return 0;
  }

  fail(ip, now = Date.now()) {
    this.ips.set(ip, [...(this.ips.get(ip) ?? []), now]);
    this.globalFails.push(now);
  }

  succeed(ip) {
    this.ips.delete(ip);
  }
}
