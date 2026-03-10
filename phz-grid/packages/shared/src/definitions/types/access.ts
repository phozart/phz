/**
 * Definition Access — role-based visibility control.
 */

export interface DefinitionAccess {
  visibility?: 'public' | 'private' | 'role-restricted';
  allowedRoles?: string[];
  owner?: string;
}
