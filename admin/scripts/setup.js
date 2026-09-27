#!/usr/bin/env node
// One-time setup: creates the login secrets for the dashboard.
// Prints environment variables to paste into Coolify, a QR code to scan with an
// authenticator app (Google Authenticator, Microsoft Authenticator, 1Password,
// Authy…), and 10 recovery codes to keep somewhere safe. Nothing is saved.
//
//   npm run setup
//   ADMIN_PASSWORD='…' npm run setup   (non-interactive)
import { createHash, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import QRCode from 'qrcode';
import { hashPassword } from '../src/auth/password.js';
import { generateSecret, otpauthUri } from '../src/auth/totp.js';

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) rl.output.write(s);
        else rl.output.write('*');
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function getPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  for (;;) {
    const a = await ask('Choose the dashboard password (at least 12 characters): ', { hidden: true });
    if (a.length < 12) {
      console.log('Too short. Use at least 12 characters; a few random words work well.');
      continue;
    }
    const b = await ask('Type it again: ', { hidden: true });
    if (a === b) return a;
    console.log('The two passwords did not match. Try again.');
  }
}

const recoveryCode = () => {
  const raw = randomBytes(8).toString('hex').toUpperCase(); // 16 hex chars
  return raw.match(/.{4}/g).join('-');
};

const password = await getPassword();
if (password.length < 12) {
  console.error('ADMIN_PASSWORD must be at least 12 characters.');
  process.exit(1);
}
const issuer = process.env.TOTP_ISSUER || 'Tansift';
const account = process.env.TOTP_ACCOUNT || 'admin';

console.log('\nHashing the password (takes a second)…');
const passwordHash = await hashPassword(password);
const totpSecret = generateSecret();
const codes = Array.from({ length: 10 }, recoveryCode);
const recoveryHashes = codes.map((c) => createHash('sha256').update(c.replace(/-/g, '')).digest('hex'));
const sessionSecret = randomBytes(32).toString('base64url');
const uri = otpauthUri(totpSecret, { issuer, account });

console.log('\n1) Scan this QR code with your authenticator app:\n');
console.log(await QRCode.toString(uri, { type: 'terminal', small: true }));
console.log(`   Or enter this key by hand: ${totpSecret.match(/.{1,4}/g).join(' ')}`);
console.log(`   (Account: ${issuer}:${account}, time-based, 6 digits, every 30 seconds)\n`);

console.log('2) Recovery codes. Each works once if you lose your phone. Store them offline:\n');
for (const c of codes) console.log(`   ${c}`);

console.log('\n3) Paste these into Coolify → your dashboard app → Environment Variables:\n');
console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
console.log(`ADMIN_TOTP_SECRET=${totpSecret}`);
console.log(`ADMIN_RECOVERY_HASHES=${recoveryHashes.join(',')}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log('\nKeep this window private and close it when done. The password itself is not stored anywhere.\n');
