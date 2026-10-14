import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../lib/password.ts';
const h = await hashPassword('senha-forte-123');
assert.equal(await verifyPassword('senha-forte-123', h), true);
assert.equal(await verifyPassword('errada', h), false);
assert.equal(await verifyPassword('x', 'formato-invalido'), false);
assert.notEqual(h, await hashPassword('senha-forte-123'));
console.log('Password hashing: scrypt verify, wrong password rejected, salted.');
