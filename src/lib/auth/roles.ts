export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const DEFAULT_USER_ROLE: UserRole = USER_ROLES.CUSTOMER;
