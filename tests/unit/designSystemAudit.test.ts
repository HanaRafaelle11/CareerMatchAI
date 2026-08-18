import { describe, it, expect } from 'vitest';
import { 
  VDS_SPACING, 
  VDS_RADIUS, 
  VDS_TYPOGRAPHY, 
  VDS_COMPONENT_STATES, 
  VDS_VISUAL_STATES 
} from '../../src/presentation/components/ds/designTokens';

describe('Design System Audit & Token Invariants', () => {
  it('should define standardized spacing tokens matching 4/8/12/16/24/32', () => {
    expect(VDS_SPACING.xs).toBe('4px');
    expect(VDS_SPACING.sm).toBe('8px');
    expect(VDS_SPACING.md).toBe('12px');
    expect(VDS_SPACING.lg).toBe('16px');
    expect(VDS_SPACING.xl).toBe('24px');
    expect(VDS_SPACING['2xl']).toBe('32px');
  });

  it('should define standardized radius tokens matching 8/12/16/full', () => {
    expect(VDS_RADIUS.sm).toBe('8px');
    expect(VDS_RADIUS.md).toBe('12px');
    expect(VDS_RADIUS.lg).toBe('16px');
    expect(VDS_RADIUS.full).toBe('9999px');
  });

  it('should define standardized typography scale H1/H2/H3/Body/Caption/Label', () => {
    expect(VDS_TYPOGRAPHY.h1.className).toContain('font-bold');
    expect(VDS_TYPOGRAPHY.h2.className).toContain('font-bold');
    expect(VDS_TYPOGRAPHY.h3.className).toContain('font-semibold');
    expect(VDS_TYPOGRAPHY.body.className).toContain('leading-relaxed');
    expect(VDS_TYPOGRAPHY.label.className).toContain('uppercase');
  });

  it('should define 8 component states matrix', () => {
    const states = Object.keys(VDS_COMPONENT_STATES);
    expect(states).toContain('default');
    expect(states).toContain('hover');
    expect(states).toContain('active');
    expect(states).toContain('disabled');
    expect(states).toContain('loading');
    expect(states).toContain('success');
    expect(states).toContain('warning');
    expect(states).toContain('error');
    expect(states.length).toBe(8);
  });

  it('should define unified 5-state visual system', () => {
    const visualStates = Object.keys(VDS_VISUAL_STATES);
    expect(visualStates).toContain('info');
    expect(visualStates).toContain('warning');
    expect(visualStates).toContain('success');
    expect(visualStates).toContain('error');
    expect(visualStates).toContain('processing');
    expect(visualStates.length).toBe(5);
  });
});
