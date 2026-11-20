import { APP_CONFIG } from '../config';
import { characterCount } from './language';

export function validateChatMessage(raw: string): string | null {
  if (!raw.trim() || characterCount(raw) > 300) {
    return APP_CONFIG.validationMessage;
  }
  return null;
}