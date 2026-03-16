import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";

const CatalogPage = lazy(() =>
  import("../pages/CatalogPage").then((module) => ({ default: module.CatalogPage }))
);
const CartPage = lazy(() =>
  import("../pages/CartPage").then((module) => ({ default: module.CartPage }))
);
const CheckoutPage = lazy(() =>
  import("../pages/CheckoutPage").then((module) => ({ default: module.CheckoutPage }))
);
const ProductPage = lazy(() =>
  import("../pages/ProductPage").then((module) => ({ default: module.ProductPage }))
);
const NotFoundPage = lazy(() =>
  import("../pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage }))
);

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<p className="text">Cargando...</p>}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: withSuspense(<CatalogPage />) },
      { path: "carrito", element: withSuspense(<CartPage />) },
      { path: "checkout", element: withSuspense(<CheckoutPage />) },
      { path: "producto/:slug", element: withSuspense(<ProductPage />) }
    ]
  },
  {
    path: "*",
    element: withSuspense(<NotFoundPage />)
  }
]);
