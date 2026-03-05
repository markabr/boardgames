const GUEST_ID_KEY = "railbound_guest_id";
const GUEST_NAME_KEY = "railbound_guest_name";

function generateId(): string {
  return crypto.randomUUID();
}

function generateName(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `Player-${num}`;
}

export function getGuestId(): string {
  if (typeof window === "undefined") return generateId();
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function getGuestName(): string {
  if (typeof window === "undefined") return generateName();
  let name = localStorage.getItem(GUEST_NAME_KEY);
  if (!name) {
    name = generateName();
    localStorage.setItem(GUEST_NAME_KEY, name);
  }
  return name;
}

export function setGuestName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_NAME_KEY, name);
}
