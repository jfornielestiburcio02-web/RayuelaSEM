'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication state is fully loaded
    if (isUserLoading) {
      return; 
    }
    
    // Once loading is complete, decide where to redirect
    if (user) {
      router.push('/modulo_acceso/Contenedor');
    } else {
      router.push('/modulo_acceso/identificacion');
    }
  }, [user, isUserLoading, router]);

  // Always show a loading screen while the check is in progress
  return (
    <main
      className="flex min-h-screen items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('https://i.ibb.co/4ZQg3zqX/RAYUELA-identificaci-n.png')" }}
    >
      <Image 
        src="https://i.ibb.co/DPCdTsLC/b4d657e7ef262b88eb5f7ac021edda87-w200.gif"
        alt="Cargando..."
        width={100}
        height={100}
        unoptimized
      />
    </main>
  );
}
