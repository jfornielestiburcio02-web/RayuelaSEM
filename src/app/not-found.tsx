'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  const handleRedirect = () => {
    router.push('/modulo_acceso/identificacion');
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-4 bg-cover bg-center text-center space-y-6"
      style={{
        backgroundImage: "url('https://i.ibb.co/4ZQg3zqX/RAYUELA-identificaci-n.png')",
      }}
    >
      <div className="bg-black/50 p-8 rounded-lg shadow-2xl text-white max-w-md">
        <h1 className="text-4xl font-bold text-yellow-400">SEM CATRP</h1>
        <h2 className="mt-4 text-2xl font-semibold">No se ha encontrado esta página</h2>
        <p className="mt-2 text-base">
          Vuelva a identificarse, gracias.
        </p>
        <Button onClick={handleRedirect} className="mt-6 bg-black hover:bg-black/90 text-white font-bold px-8 w-full">
          Aceptar
        </Button>
      </div>
    </main>
  );
}
