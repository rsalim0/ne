import bcrypt from 'bcryptjs'
import { getConfig } from '@/lib/config'

/** Hash a plaintext password using bcrypt (cost from config, default 12). */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, getConfig().BCRYPT_ROUNDS)
}

/** Constant-time compare of plaintext against a stored bcrypt hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
