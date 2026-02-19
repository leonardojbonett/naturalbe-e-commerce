import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { CatalogPage } from "../pages/CatalogPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProductPage } from "../pages/ProductPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: "carrito", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "producto/:slug", element: <ProductPage /> }
    ]
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);
