import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="container stack">
      <h1 className="title">404</h1>
      <p className="text">La ruta no existe en la app.</p>
      <Link to="/">Volver al inicio</Link>
    </main>
  );
}

