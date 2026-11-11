import { describe, it, expect } from 'vitest';
import {
  resolveContractedModules,
  hasModuleAccess,
  getActiveModulesList,
  getUncontractedModulesList,
  getPrimaryModuleRoute,
  findMatchingPackagePreset,
  isGeneralAdmin,
  MODULE_PACKAGES,
} from './saas-modules';

describe('SaaS Modular Ecosystem Architecture (saas-modules)', () => {
  describe('isGeneralAdmin', () => {
    it('identifies general admins by email or role', () => {
      expect(isGeneralAdmin('diemoroy@gmail.com', 'user')).toBe(true);
      expect(isGeneralAdmin('ADMIN@SANTISOFT.CL', null)).toBe(true);
      expect(isGeneralAdmin('cliente@restaurante.cl', 'admin')).toBe(true);
      expect(isGeneralAdmin('cliente@restaurante.cl', 'owner')).toBe(false);
      expect(isGeneralAdmin(null, null)).toBe(false);
    });
  });

  describe('resolveContractedModules — Explicit Combinations', () => {
    it('supports client with ONLY Carta QR contracted (Cafetería Central case)', () => {
      const modules = resolveContractedModules({
        plan: 'esencial',
        contractedModules: { marketing: false, qr: true, fideliza: false },
      });
      expect(modules).toEqual({ marketing: false, qr: true, fideliza: false });
      expect(hasModuleAccess(modules, 'marketing')).toBe(false);
      expect(hasModuleAccess(modules, 'qr')).toBe(true);
      expect(hasModuleAccess(modules, 'fideliza')).toBe(false);
      expect(getPrimaryModuleRoute(modules)).toBe('/automatizacion-rrss/panel/menu-qr');
    });

    it('supports client with ONLY Fideliza contracted', () => {
      const modules = resolveContractedModules({
        plan: 'esencial',
        contractedModules: { marketing: false, qr: false, fideliza: true },
      });
      expect(modules).toEqual({ marketing: false, qr: false, fideliza: true });
      expect(getPrimaryModuleRoute(modules)).toBe('/automatizacion-rrss/panel/fidelizacion');
    });

    it('supports client with ONLY Marketing contracted (Tienda Comercial case)', () => {
      const modules = resolveContractedModules({
        plan: 'crecimiento',
        contractedModules: { marketing: true, qr: false, fideliza: false },
      });
      expect(modules).toEqual({ marketing: true, qr: false, fideliza: false });
      expect(getPrimaryModuleRoute(modules)).toBe('/automatizacion-rrss/panel');
    });

    it('supports client with all 3 modules contracted (Restaurante Manía case)', () => {
      const modules = resolveContractedModules({
        plan: 'piloto_automatico',
        contractedModules: { marketing: true, qr: true, fideliza: true },
      });
      expect(modules).toEqual({ marketing: true, qr: true, fideliza: true });
      expect(getActiveModulesList(modules)).toHaveLength(3);
      expect(getUncontractedModulesList(modules)).toHaveLength(0);
    });

    it('prioritizes business profile-level contractedModules when specified', () => {
      const modules = resolveContractedModules(
        {
          contractedModules: { marketing: true, qr: false, fideliza: false },
        },
        {
          id: 'prof_restaurante_2',
          contractedModules: { marketing: false, qr: true, fideliza: true },
        }
      );
      expect(modules).toEqual({ marketing: false, qr: true, fideliza: true });
    });
  });

  describe('resolveContractedModules — Non-Destructive Legacy Fallbacks', () => {
    it('preserves Marketing access and existing QR/Fideliza flags for legacy users without contractedModules', () => {
      const legacyWithMenu = resolveContractedModules(
        { plan: 'esencial' },
        { id: 'default', menuDigitalEnabled: true, fidelizacionEnabled: false }
      );
      expect(legacyWithMenu).toEqual({ marketing: true, qr: true, fideliza: false });

      const legacyWithFideliza = resolveContractedModules(
        { plan: 'crecimiento' },
        { id: 'default', menuDigitalEnabled: false, fidelizacionConfig: { enabled: true } }
      );
      expect(legacyWithFideliza).toEqual({ marketing: true, qr: false, fideliza: true });
    });

    it('enables all 3 modules for legacy piloto_automatico accounts', () => {
      const pilotoLegacy = resolveContractedModules({ plan: 'piloto_automatico' }, { id: 'default' });
      expect(pilotoLegacy).toEqual({ marketing: true, qr: true, fideliza: true });
    });
  });

  describe('MODULE_PACKAGES & Presets', () => {
    it('defines all 7 commercial module combinations without SEO/GEO', () => {
      expect(MODULE_PACKAGES).toHaveLength(7);
      const qrOnly = findMatchingPackagePreset({ marketing: false, qr: true, fideliza: false });
      expect(qrOnly?.id).toBe('only_qr');

      const full = findMatchingPackagePreset({ marketing: true, qr: true, fideliza: true });
      expect(full?.id).toBe('full_ecosystem');
    });
  });
});
