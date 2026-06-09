import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";
import { SHOP_ENABLED } from "@/lib/features";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/api/hooks/use-auth";
import { selectCartCount, useCartStore } from "@/stores/cart-store";

const ALL_DESKTOP_NAV = [
  { to: "/", label: "Inicio", end: true, key: "home" },
  { to: "/book", label: "Reservar", end: false, key: "book" },
  { to: "/my/appointments", label: "Mis citas", end: false, key: "appointments" },
  { to: "/memberships", label: "Membresías", end: false, key: "memberships" },
  { to: "/shop", label: "Tienda", end: false, key: "shop" },
];

const DESKTOP_NAV = ALL_DESKTOP_NAV.filter(
  (item) => SHOP_ENABLED || item.key !== "shop",
);

export function TopBar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const storeLogout = useAuthStore((s) => s.logout);
  const logoutMutation = useLogout();
  const cartCount = useCartStore(selectCartCount);

  async function handleLogout() {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      await logoutMutation.mutateAsync(refresh);
    }
    storeLogout();
    navigate("/login", { replace: true });
  }

  return (
    <header
      className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <img src="/doggo-logo.png" alt="" className="h-7 w-auto" />
          <span className="text-base">Doggo Mundo</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Navegación">
          {DESKTOP_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {SHOP_ENABLED && (
            <Link
              to="/cart"
              aria-label={
                cartCount > 0
                  ? `Carrito con ${cartCount} producto${cartCount === 1 ? "" : "s"}`
                  : "Carrito"
              }
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
                  aria-hidden="true"
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          )}

          {user && (
            <Link
              to="/profile"
              className={cn(
                "group inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-2 sm:pr-3 text-sm transition-colors",
                "hover:bg-muted",
              )}
              aria-label="Ir a mi perfil"
            >
              <UserAvatar
                name={user.full_name || user.first_name || "?"}
                photo={user.photo}
                size="xs"
              />
              <span className="hidden text-muted-foreground group-hover:text-foreground sm:inline">
                {user.first_name}
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            aria-label="Cerrar sesión"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
