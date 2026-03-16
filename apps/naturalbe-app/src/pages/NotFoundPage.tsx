import { Link } from "react-router-dom";
import { useEffect } from "react";
import { applySeoMeta } from "../core/seo/meta";

export function NotFoundPage() {
  useEffect(() => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}${window.location.search}`
        : "https://naturalbe.com.co/404";

    applySeoMeta({
      title: "404 | Natural Be",
      description: "La ruta solicitada no existe en Natural Be.",
      url,
      image: "https://naturalbe.com.co/static/img/og-naturalbe.jpg",
      type: "website",
      indexable: false
    });
  }, []);

  return (
    <main className="container stack">
      <h1 className="title">404</h1>
      <p className="text">La ruta no existe en la app.</p>
      <Link to="/">Volver al inicio</Link>
    </main>
  );
}
