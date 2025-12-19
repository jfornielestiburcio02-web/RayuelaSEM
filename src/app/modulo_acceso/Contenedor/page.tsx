'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';

type UserProfile = {
  role: string[];
};

export default function ContenedorPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );

  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    // First, wait for the user loading to finish.
    if (isUserLoading) {
      return; // Do nothing until we know if a user is logged in or not.
    }
    // If loading is finished and there's no user, redirect to login.
    if (!user) {
      router.push('/modulo_acceso/identificacion');
    }
  }, [user, isUserLoading, router]);

  const isLoading = isUserLoading || isUserDataLoading;

  // While loading, show a spinner. This also prevents content flashing.
  if (isLoading) {
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

  // If loading is complete, but there is still no user (e.g., after the effect runs), we also can show a loading or redirect.
  // This check is a safeguard. The useEffect should handle the redirect.
  if (!user) {
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

  const userRoles = userData?.role || [];

  const canSeeGestionSEM = userRoles.includes('Instructor Gestion');
  const canSeeSeguimientoSEM = userRoles.includes('SEM') || userRoles.includes('Instructor');
  const canSeeDireccion = userRoles.includes('Dirección');
  const canSeeFaccionesLegales = userRoles.includes('Facciones Legales');
  const isCiudadanoOnly = userRoles.length === 1 && userRoles.includes('Ciudadano');
  const canSeeSecretaria = userRoles.includes('Secretaría');

  const seguimientoHref = () => {
    if (userRoles.includes('Instructor')) {
      return '/modulo_acceso/Controlador?view=instructor';
    }
    if (userRoles.includes('SEM')) {
      return '/modulo_acceso/Controlador?view=sem';
    }
    return '/modulo_acceso/Controlador';
  };

  if (isCiudadanoOnly) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center p-4 bg-cover bg-center space-y-8"
        style={{ backgroundImage: "url('https://i.ibb.co/4ZQg3zqX/RAYUELA-identificaci-n.png')" }}
        aria-label="Fondo abstracto con formas geométricas y colores pastel."
      >
        <div className="bg-white/90 dark:bg-black/80 p-8 rounded-xl shadow-lg text-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Solicitudes Futuras</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Este espacio está reservado para futuras funcionalidades.</p>
        </div>
      </main>
    );
  }

  const availableSections = [];
  if (canSeeGestionSEM) {
    availableSections.push(
      <Link href="/modulo_acceso/Controlador?view=gestion_sem" passHref key="gestion">
        <Image
          src="https://i.ibb.co/fbVrFv3/Seguimiento-SEM-2-1.png"
          alt="Gestión SEM"
          width={300}
          height={200}
          className="cursor-pointer"
          data-ai-hint="management dashboard"
        />
      </Link>
    );
  }
  if (canSeeSeguimientoSEM) {
    availableSections.push(
      <Link href={seguimientoHref()} passHref key="seguimiento">
        <Image
          src="https://i.ibb.co/pB2ZcHTT/Seguimiento-SEM-1-1.png"
          alt="Seguimiento SEM"
          width={300}
          height={200}
          className="cursor-pointer"
          data-ai-hint="tracking chart"
        />
      </Link>
    );
  }
  if (canSeeDireccion) {
    availableSections.push(
      <Link href="/modulo_acceso/Controlador?view=direccion" passHref key="direccion">
        <Image
          src="https://i.ibb.co/p6fFQxGk/Seguimiento-SEM-3-1-1.png"
          alt="Dirección"
          width={300}
          height={200}
          className="cursor-pointer"
          data-ai-hint="direction analytics"
        />
      </Link>
    );
  }
  if (canSeeFaccionesLegales) {
    availableSections.push(
      <Link href="/modulo_acceso/Controlador?view=facciones_legales" passHref key="facciones_legales">
        <Image
          src="https://i.ibb.co/bjsjnZFM/Facciones-Legales-1.png"
          alt="Facciones Legales"
          width={300}
          height={200}
          className="cursor-pointer"
          data-ai-hint="legal factions"
        />
      </Link>
    );
  }
    if (canSeeSecretaria) {
    availableSections.push(
      <Link href="/modulo_acceso/Controlador?view=secretaria" passHref key="secretaria">
        <Image
          src="https://i.ibb.co/MkrCfjxB/Dise-o-sin-t-tulo-7-1.png"
          alt="Secretaría"
          width={300}
          height={200}
          className="cursor-pointer"
          data-ai-hint="secretary desk"
        />
      </Link>
    );
  }

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-4 bg-cover bg-center space-y-8"
      style={{ backgroundImage: "url('https://i.ibb.co/4ZQg3zqX/RAYUELA-identificaci-n.png')" }}
      aria-label="Fondo abstracto con formas geométricas y colores pastel."
    >
       <div className="flex flex-wrap justify-center items-center gap-8">
        {availableSections}
      </div>
    </main>
  );
}
