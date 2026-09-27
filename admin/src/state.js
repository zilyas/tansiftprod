// Tiny persistent state on a volume (DATA_DIR): the last accepted TOTP step
// (so a code can be used only once, even across restarts) and which recovery
// codes have been used. This is a file, not a database.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export class State {
  constructor(dir) {
    this.file = join(dir, 'auth-state.json');
    this.data = { lastTotpStep: -1, usedRecovery: [] };
    try {
      mkdirSync(dir, { recursive: true });
      this.data = { ...this.data, ...JSON.parse(readFileSync(this.file, 'utf8')) };
    } catch {
      // First start or no volume: keep defaults in memory.
    }
  }

  get lastTotpStep() {
    return this.data.lastTotpStep;
  }

  setLastTotpStep(step) {
    this.data.lastTotpStep = step;
    this.#save();
  }

  isRecoveryUsed(hash) {
    return this.data.usedRecovery.includes(hash);
  }

  markRecoveryUsed(hash) {
    this.data.usedRecovery.push(hash);
    this.#save();
  }

  #save() {
    try {
      const tmp = `${this.file}.tmp`;
      writeFileSync(tmp, JSON.stringify(this.data));
      renameSync(tmp, this.file); // atomic replace
    } catch (err) {
      console.error(JSON.stringify({ level: 'warn', msg: 'could not persist auth state', error: String(err) }));
    }
  }
}
