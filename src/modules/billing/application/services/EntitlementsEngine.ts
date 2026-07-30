export type EntitlementMap = Record<string, string | boolean | number>;

export class EntitlementsEngine {
  /**
   * Avalia se uma capacidade (entitlement) está liberada para o usuário.
   */
  static canAccess(entitlements: EntitlementMap, key: string): boolean {
    const value = entitlements[key];
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value === 'true') return true;
      if (value === 'false') return false;
      if (value === 'unlimited') return true;
      const num = Number(value);
      return !isNaN(num) && num > 0;
    }
    if (typeof value === 'number') return value > 0;
    return false;
  }

  /**
   * Obtém o limite numérico de um entitlement. Retorna Infinity se ilimitado.
   */
  static getLimit(entitlements: EntitlementMap, key: string): number {
    const value = entitlements[key];
    if (value === undefined || value === null || value === 'false' || value === false) return 0;
    if (value === 'unlimited' || value === true || value === 'true') return Infinity;
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  }
}
