export function isValidJournalPin(pin) {
  return /^\d{4,6}$/.test(pin);
}