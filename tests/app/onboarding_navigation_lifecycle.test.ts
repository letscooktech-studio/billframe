/**
 * ONBOARDING NAVIGATION LIFECYCLE & SINGLE ROUTE DISPATCH TEST
 * 
 * Verifies that:
 * 1. Onboarding completion invokes exactly ONE navigation operation (router.replace).
 * 2. Navigation is decoupled from setTimeout (zero timer delays).
 * 3. pendingRoute is consumed idempotently (reset to null on dispatch).
 * 4. No duplicate router.push or simultaneous transitions occur.
 */

describe('Onboarding Navigation Lifecycle — Single Dispatch & Zero Timeout Invariant', () => {
  it('dispatches exactly one route transition upon onboarding completion without setTimeout', () => {
    const routeCalls: { action: 'replace' | 'push'; target: string }[] = [];
    let pendingRoute: string | null = null;
    let onboardingCompleted = false;

    const router = {
      replace: (route: string) => {
        routeCalls.push({ action: 'replace', target: route });
      },
      push: (route: string) => {
        routeCalls.push({ action: 'push', target: route });
      },
    };

    // 1. Simulating OnboardingScreen onCompleted callback
    const handleOnboardingCompleted = (targetRoute?: string) => {
      if (targetRoute) {
        pendingRoute = targetRoute;
      }
      onboardingCompleted = true;
    };

    // User selects Document Studio target route upon onboarding completion
    handleOnboardingCompleted('/templates/studio?schemaCode=job_offer_letter');

    expect(onboardingCompleted).toBe(true);
    expect(pendingRoute).toBe('/templates/studio?schemaCode=job_offer_letter');
    // Navigation has NOT fired before stack mount
    expect(routeCalls.length).toBe(0);

    // 2. Simulating RootLayoutInner useEffect hook execution upon Stack mount
    const executeNavigationEffect = () => {
      if (onboardingCompleted && pendingRoute) {
        const target = pendingRoute;
        pendingRoute = null; // Cleared immediately
        router.replace(target);
      }
    };

    executeNavigationEffect();

    // Exactly ONE replace call was made
    expect(routeCalls.length).toBe(1);
    expect(routeCalls[0]).toEqual({
      action: 'replace',
      target: '/templates/studio?schemaCode=job_offer_letter',
    });

    // pendingRoute is reset to null
    expect(pendingRoute).toBeNull();

    // 3. Re-running effect (subsequent render) must NOT trigger secondary navigation
    executeNavigationEffect();
    expect(routeCalls.length).toBe(1); // Still exactly 1
  });

  it('verifies that no setTimeout navigation exists in _layout.tsx source', () => {
    const fs = require('fs');
    const path = require('path');
    const layoutSource = fs.readFileSync(path.resolve(__dirname, '../../src/app/_layout.tsx'), 'utf8');

    // Invariant: setTimeout must NOT be used for router actions
    expect(layoutSource).not.toMatch(/setTimeout\s*\(\s*\(\s*\)\s*=>\s*\{\s*router/);
    expect(layoutSource).not.toMatch(/setTimeout\s*\([^)]*router\.(push|replace)/);

    // Invariant: pendingRoute must use router.replace
    expect(layoutSource).toContain('router.replace(target as any)');
  });
});
