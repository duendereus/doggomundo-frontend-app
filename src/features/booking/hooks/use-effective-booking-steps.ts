import { useLocations } from "@/api/hooks/use-locations";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { BOOKING_STEPS } from "@/features/booking/lib/steps";
import type { BookingStep } from "@/features/booking/lib/steps";

interface EffectiveSteps {
  steps: BookingStep[];
  total: number;
  skipLocation: boolean;
}

/**
 * The booking wizard skips the "¿En qué sucursal?" step when only one
 * sucursal can actually serve the user — picking from a list of one is
 * busywork. Step indices and totals reflow so the progress reads
 * "Paso N de 5" instead of jumping from 1/6 to 3/6.
 *
 * Skip rule:
 * - When a BU is already picked: skip if exactly one sucursal offers it.
 *   This is the authoritative rule used by LocationPickerPage as well.
 * - When no BU is picked yet (step 1 header): skip if there's exactly one
 *   sucursal with at least one BusinessUnit registered. A sucursal with
 *   zero BUs (e.g. a placeholder admin row, or a retail-only location)
 *   can't serve any booking, so it doesn't count toward the picker.
 *
 * Adding a second functional sucursal in the admin automatically restores
 * the step — no code change required.
 */
export function useEffectiveBookingSteps(): EffectiveSteps {
  const { data } = useLocations();
  const businessUnitCode = useBookingFlowStore((s) => s.businessUnitCode);

  let skipLocation = false;
  if (data) {
    if (businessUnitCode) {
      const matching = data.results.filter((loc) =>
        loc.business_units.some((bu) => bu.code === businessUnitCode),
      ).length;
      skipLocation = matching === 1;
    } else {
      const validLocations = data.results.filter(
        (loc) => loc.business_units.length > 0,
      ).length;
      skipLocation = validLocations === 1;
    }
  }

  if (!skipLocation) {
    return { steps: BOOKING_STEPS, total: BOOKING_STEPS.length, skipLocation };
  }

  const steps = BOOKING_STEPS.filter((s) => s.key !== "location").map(
    (s, i) => ({ ...s, index: i + 1 }),
  );
  return { steps, total: steps.length, skipLocation };
}
