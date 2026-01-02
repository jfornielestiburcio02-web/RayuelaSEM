import LoginForm from './login-form';

export default function IdentificacionPage() {
  return (
    <main
      className="flex min-h-screen items-start justify-center p-4 bg-cover bg-center pt-48"
      style={{
        backgroundImage: "url('https://i.ibb.co/4ZQg3zqX/RAYUELA-identificaci-n.png')",
      }}
      aria-label="Fondo abstracto con formas geométricas y colores pastel."
    >
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  );
}
