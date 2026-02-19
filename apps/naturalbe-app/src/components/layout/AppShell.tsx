import { NavLink, Outlet } from "react-router-dom";
import { selectCartItemsCount, useCartStore } from "../../features/cart/useCartStore";

export function AppShell() {
  const totalItems = useCartStore((state) => selectCartItemsCount(state.items));

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="container header-row">
          <strong className="brand">Natural Be App</strong>
          <nav className="header-nav" aria-label="Navegacion principal">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
              end
            >
              Catalogo
            </NavLink>
            <NavLink
              to="/carrito"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active nav-link-cart" : "nav-link nav-link-cart"
              }
            >
              Carrito
              {totalItems > 0 ? <span className="cart-badge">{totalItems}</span> : null}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="container app-content">
        <Outlet />
      </main>
    </div>
  );
}
