import crypto from 'node:crypto';
import { config } from './config';

const SECRET = crypto
  .createHash('sha256')
  .update('atiya-secret:' + config.adminPassword)
  .digest('hex');

export function makeToken(): string {
  return crypto.createHmac('sha256', SECRET).update('admin-session').digest('hex');
}

const TOKEN = makeToken();

export function checkPassword(pw: unknown): boolean {
  return typeof pw === 'string' && pw.length > 0 && pw === config.adminPassword;
}

export function verifyToken(token?: string): boolean {
  return !!token && token === TOKEN;
}
