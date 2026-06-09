import { useEffect, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { LocationCard } from "@/features/booking/components/LocationCard";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { useLocations } from "@/api/hooks/use-locations";
import { BUSINESS_UNIT_LABEL } from "@/types/business-unit";
import type { BusinessUnitCode } from "@/types/business-unit";
import type { LocationListItem, LocationBusinessUnit } from "@/types/location";

function findBusinessUnit(
  location: LocationListItem,
  code: BusinessUnitCode,
): LocationBusinessUnit | null {
  return location.business_units.find((bu) => bu.code === code) ?? null;
}

export function LocationPickerPage() {
  const navigate = useNavigate();
  const businessUnitCode = useBookingFlowStore((s) => s.businessUnitCode);
  const selected = useBookingFlowStore((s) => s.location);
  const setLocation = useBookingFlowStore((s) => s.setLocation);

  const { data, isLoading, isError } = useLocations();

  const matchingLocations = useMemo(() => {
    if (!data || !businessUnitCode) return [];
    return data.results.filter(
      (loc) => findBusinessUnit(loc, businessUnitCode) !== null,
    );
  }, [data, businessUnitCode]);

  // Auto-skip: when only one sucursal offers the picked BU, lock it in
  // and jump straight to the service step so the user isn't forced to
  // click through a list of one. Sucursales without the BU are filtered
  // upstream, so a placeholder sucursal with zero BUs (or one that
  // doesn't carry this BU) doesn't count.
  const shouldAutoSkip =
    matchingLocations.length === 1 && !!businessUnitCode;

  useEffect(() => {
    if (!shouldAutoSkip) return;
    const location = matchingLocations[0];
    const bu = findBusinessUnit(location, businessUnitCode!);
    if (!bu) return;
    setLocation({
      id: location.id,
      name: location.name,
      address: location.address,
      businessUnitId: bu.id,
      businessUnitName: bu.name,
    });
    navigate("/book/service", { replace: true });
  }, [shouldAutoSkip, matchingLocations, businessUnitCode, setLocation, navigate]);

  if (!businessUnitCode) return <Navigate to="/book/business-unit" replace />;

  function handleSelect(location: LocationListItem) {
    if (!businessUnitCode) return;
    const bu = findBusinessUnit(location, businessUnitCode);
    if (!bu) return;
    setLocation({
      id: location.id,
      name: location.name,
      address: location.address,
      businessUnitId: bu.id,
      businessUnitName: bu.name,
    });
    navigate("/book/service");
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <BookingStepHeader
        stepKey="location"
        backTo="/book/business-unit"
        title="¿En qué sucursal?"
        description={BUSINESS_UNIT_LABEL[businessUnitCode]}
      />

      {isLoading || shouldAutoSkip ? (
        <LoadingState rows={3} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar las sucursales" />
      ) : matchingLocations.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-12 w-12" />}
          title={`Ninguna sucursal ofrece ${BUSINESS_UNIT_LABEL[businessUnitCode]}`}
          description="Prueba con otro tipo de servicio."
        />
      ) : (
        <ul className="space-y-2">
          {matchingLocations.map((location) => (
            <li key={location.id}>
              <LocationCard
                location={location}
                selected={selected?.id === location.id}
                onSelect={() => handleSelect(location)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
