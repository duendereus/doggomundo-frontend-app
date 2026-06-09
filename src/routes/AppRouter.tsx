import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { LoadingState } from "@/components/shared/LoadingState";
import { useAuthRestore } from "@/hooks/use-auth-restore";
import { SHOP_ENABLED } from "@/lib/features";

const LoginPage = lazy(() =>
  import("@/features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/features/auth/pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);
const VerifyEmailPage = lazy(() =>
  import("@/features/auth/pages/VerifyEmailPage").then((m) => ({
    default: m.VerifyEmailPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/features/auth/pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("@/features/auth/pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);

const HomePage = lazy(() =>
  import("@/features/home/pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const ProfilePage = lazy(() =>
  import("@/features/profile/pages/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  })),
);

const PetListPage = lazy(() =>
  import("@/features/pets/pages/PetListPage").then((m) => ({ default: m.PetListPage })),
);
const PetCreatePage = lazy(() =>
  import("@/features/pets/pages/PetCreatePage").then((m) => ({
    default: m.PetCreatePage,
  })),
);
const PetDetailPage = lazy(() =>
  import("@/features/pets/pages/PetDetailPage").then((m) => ({
    default: m.PetDetailPage,
  })),
);
const PetEditPage = lazy(() =>
  import("@/features/pets/pages/PetEditPage").then((m) => ({ default: m.PetEditPage })),
);
const MedicalRecordsPage = lazy(() =>
  import("@/features/pets/pages/MedicalRecordsPage").then((m) => ({
    default: m.MedicalRecordsPage,
  })),
);
const VaccinationsPage = lazy(() =>
  import("@/features/pets/pages/VaccinationsPage").then((m) => ({
    default: m.VaccinationsPage,
  })),
);
const PetDocumentsPage = lazy(() =>
  import("@/features/pets/pages/PetDocumentsPage").then((m) => ({
    default: m.PetDocumentsPage,
  })),
);

const BookingLandingPage = lazy(() =>
  import("@/features/booking/pages/BookingLandingPage").then((m) => ({
    default: m.BookingLandingPage,
  })),
);
const BusinessUnitPickerPage = lazy(() =>
  import("@/features/booking/pages/BusinessUnitPickerPage").then((m) => ({
    default: m.BusinessUnitPickerPage,
  })),
);
const ServicePickerPage = lazy(() =>
  import("@/features/booking/pages/ServicePickerPage").then((m) => ({
    default: m.ServicePickerPage,
  })),
);
const LocationPickerPage = lazy(() =>
  import("@/features/booking/pages/LocationPickerPage").then((m) => ({
    default: m.LocationPickerPage,
  })),
);
const SlotPickerPage = lazy(() =>
  import("@/features/booking/pages/SlotPickerPage").then((m) => ({
    default: m.SlotPickerPage,
  })),
);
const PetPickerPage = lazy(() =>
  import("@/features/booking/pages/PetPickerPage").then((m) => ({
    default: m.PetPickerPage,
  })),
);
const BookingReviewPage = lazy(() =>
  import("@/features/booking/pages/BookingReviewPage").then((m) => ({
    default: m.BookingReviewPage,
  })),
);

const MyAppointmentsPage = lazy(() =>
  import("@/features/appointments/pages/MyAppointmentsPage").then((m) => ({
    default: m.MyAppointmentsPage,
  })),
);
const AppointmentDetailPage = lazy(() =>
  import("@/features/appointments/pages/AppointmentDetailPage").then((m) => ({
    default: m.AppointmentDetailPage,
  })),
);

const MyOrdersPage = lazy(() =>
  import("@/features/orders/pages/MyOrdersPage").then((m) => ({
    default: m.MyOrdersPage,
  })),
);
const OrderDetailPage = lazy(() =>
  import("@/features/orders/pages/OrderDetailPage").then((m) => ({
    default: m.OrderDetailPage,
  })),
);

const MembershipCatalogPage = lazy(() =>
  import("@/features/memberships/pages/MembershipCatalogPage").then((m) => ({
    default: m.MembershipCatalogPage,
  })),
);
const SubscribePage = lazy(() =>
  import("@/features/memberships/pages/SubscribePage").then((m) => ({
    default: m.SubscribePage,
  })),
);
const MySubscriptionsPage = lazy(() =>
  import("@/features/memberships/pages/MySubscriptionsPage").then((m) => ({
    default: m.MySubscriptionsPage,
  })),
);
const SubscriptionDetailPage = lazy(() =>
  import("@/features/memberships/pages/SubscriptionDetailPage").then((m) => ({
    default: m.SubscriptionDetailPage,
  })),
);

const ShopPage = lazy(() =>
  import("@/features/shop/pages/ShopPage").then((m) => ({
    default: m.ShopPage,
  })),
);
const ProductDetailPage = lazy(() =>
  import("@/features/shop/pages/ProductDetailPage").then((m) => ({
    default: m.ProductDetailPage,
  })),
);
const CartPage = lazy(() =>
  import("@/features/shop/pages/CartPage").then((m) => ({
    default: m.CartPage,
  })),
);
const CheckoutPage = lazy(() =>
  import("@/features/shop/pages/CheckoutPage").then((m) => ({
    default: m.CheckoutPage,
  })),
);
const CheckoutSuccessPage = lazy(() =>
  import("@/features/shop/pages/CheckoutSuccessPage").then((m) => ({
    default: m.CheckoutSuccessPage,
  })),
);

const DaycareLandingPage = lazy(() =>
  import("@/features/daycare/pages/DaycareLandingPage").then((m) => ({
    default: m.DaycareLandingPage,
  })),
);
const DaycareEnrollPage = lazy(() =>
  import("@/features/daycare/pages/DaycareEnrollPage").then((m) => ({
    default: m.DaycareEnrollPage,
  })),
);
const DaycareBookPage = lazy(() =>
  import("@/features/daycare/pages/DaycareBookPage").then((m) => ({
    default: m.DaycareBookPage,
  })),
);
const DaycareDaysPage = lazy(() =>
  import("@/features/daycare/pages/DaycareDaysPage").then((m) => ({
    default: m.DaycareDaysPage,
  })),
);
const DaycareDayDetailPage = lazy(() =>
  import("@/features/daycare/pages/DaycareDayDetailPage").then((m) => ({
    default: m.DaycareDayDetailPage,
  })),
);

function SuspendedFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <LoadingState rows={2} />
    </div>
  );
}

export function AppRouter() {
  const { isLoading } = useAuthRestore();

  if (isLoading) {
    return <SuspendedFallback />;
  }

  return (
    <Suspense fallback={<SuspendedFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Authenticated users (any role can use the customer app) */}
        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />

              <Route path="/profile" element={<ProfilePage />} />

              <Route path="/pets" element={<PetListPage />} />
              <Route path="/pets/new" element={<PetCreatePage />} />
              <Route path="/pets/:id" element={<PetDetailPage />} />
              <Route path="/pets/:id/edit" element={<PetEditPage />} />
              <Route path="/pets/:id/medical-records" element={<MedicalRecordsPage />} />
              <Route path="/pets/:id/vaccinations" element={<VaccinationsPage />} />
              <Route path="/pets/:id/documents" element={<PetDocumentsPage />} />

              <Route path="/book" element={<BookingLandingPage />} />
              <Route path="/book/business-unit" element={<BusinessUnitPickerPage />} />
              <Route path="/book/service" element={<ServicePickerPage />} />
              <Route path="/book/location" element={<LocationPickerPage />} />
              <Route path="/book/slot" element={<SlotPickerPage />} />
              <Route path="/book/pet" element={<PetPickerPage />} />
              <Route path="/book/review" element={<BookingReviewPage />} />

              <Route path="/my/appointments" element={<MyAppointmentsPage />} />
              <Route path="/my/appointments/:id" element={<AppointmentDetailPage />} />

              <Route path="/my/orders" element={<MyOrdersPage />} />
              <Route path="/my/orders/:id" element={<OrderDetailPage />} />

              <Route path="/memberships" element={<MembershipCatalogPage />} />
              <Route
                path="/memberships/subscribe/:planId"
                element={<SubscribePage />}
              />
              <Route path="/my/subscriptions" element={<MySubscriptionsPage />} />
              <Route
                path="/my/subscriptions/:id"
                element={<SubscriptionDetailPage />}
              />

              {SHOP_ENABLED && (
                <>
                  <Route path="/shop" element={<ShopPage />} />
                  <Route
                    path="/shop/products/:id"
                    element={<ProductDetailPage />}
                  />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route
                    path="/checkout/success"
                    element={<CheckoutSuccessPage />}
                  />
                </>
              )}

              <Route path="/daycare" element={<DaycareLandingPage />} />
              <Route
                path="/daycare/plans/:planId/enroll"
                element={<DaycareEnrollPage />}
              />
              <Route path="/daycare/book" element={<DaycareBookPage />} />
              <Route path="/daycare/days" element={<DaycareDaysPage />} />
              <Route
                path="/daycare/days/:id"
                element={<DaycareDayDetailPage />}
              />
            </Route>
          </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
