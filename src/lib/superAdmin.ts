// Email du super administrateur — ne peut pas être révoqué.
export const SUPER_ADMIN_EMAIL = "isaacfanou1512@gmail.com";

export const isSuperAdmin = (email?: string | null) =>
  !!email && email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
