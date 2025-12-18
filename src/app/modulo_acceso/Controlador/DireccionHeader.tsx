'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


type UserProfile = {
  username?: string;
  email?: string;
  fotoUrl?: string;
  role?: string[];
};

type DireccionHeaderProps = {
    currentView: string;
    onSelectSubRole: (subRole: 'Actividades Extr.' | 'Jefaturas' | 'Secretaría' | 'main') => void;
    onOpenConfig: () => void;
};

const viewToRoleName: Record<string, string> = {
    'instructor': 'Instructor',
    'sem': 'SEM',
    'gestion_sem': 'Instructor Gestión',
    'direccion': 'Dirección',
    'responsable_faccion': 'Responsable Faccion',
    'facciones_legales': 'Facciones Legales',
}

export default function DireccionHeader({ currentView, onSelectSubRole, onOpenConfig }: DireccionHeaderProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );

  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserProfile>(userDocRef);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/modulo_acceso/identificacion');
  };
  
  const handleRoleChange = (roleView: string) => {
    if (roleView === 'direccion') {
        onSelectSubRole('main');
    }
    router.push(`/modulo_acceso/Controlador?view=${roleView}`);
  };

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  const userRoles = userData?.role || [];
  const hasDireccionRole = userRoles.includes('Dirección');
  
  const availableRoles = userRoles.filter(r => r !== viewToRoleName[currentView]);


  if (isUserLoading || isUserDataLoading) {
    return (
      <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b w-full">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="w-24 h-4 bg-gray-200 animate-pulse" />
        </div>
        <div className="flex gap-2">
            <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-md" />
            <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-md" />
        </div>
      </header>
    );
  }

  const currentRoleName = viewToRoleName[currentView] || 'Usuario';

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b w-full gap-4">
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-4 focus:outline-none">
              <Avatar>
                <AvatarImage src={userData?.fotoUrl} alt={userData?.username} />
                <AvatarFallback>{getInitials(userData?.username)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-left">{userData?.username}</p>
                <p className="text-xs text-gray-500 text-left">{currentRoleName}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onOpenConfig}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        {availableRoles.map(role => {
            if (role === 'Dirección') {
                return (
                    <Button key={role} variant="ghost" className="text-center h-auto py-1 flex flex-col items-center gap-1" onClick={() => handleRoleChange('direccion')}>
                        <Image src="https://i.ibb.co/p6fFQxGk/Seguimiento-SEM-3-1-1.png" alt="Dirección Icon" width={32} height={32} />
                        <span className='text-xs'>Dirección</span>
                    </Button>
                )
            }
            if (role === 'Instructor') {
                 return (
                    <Button key={role} variant="ghost" className="text-center h-auto py-1 flex flex-col items-center gap-1" onClick={() => handleRoleChange('instructor')}>
                        <Image src="https://i.ibb.co/TDcSG9Rz/Dise-o-sin-t-tulo-9-1.png" alt="Instructor Icon" width={32} height={32} />
                        <span className='text-xs'>Instructor</span>
                    </Button>
                )
            }
            if (role === 'SEM') {
                return (
                    <Button key={role} variant="ghost" className="text-center h-auto py-1 flex flex-col items-center gap-1" onClick={() => handleRoleChange('sem')}>
                         <Image src="https://i.ibb.co/NdZjrPS2/Dise-o-sin-t-tulo-10-2.png" alt="SEM Icon" width={32} height={32} />
                        <span className='text-xs'>SEM</span>
                    </Button>
                )
            }
            if (role === 'Instructor Gestion') {
                return (
                     <Button key={role} variant="ghost" className="text-center h-auto py-1 flex flex-col items-center gap-1" onClick={() => handleRoleChange('gestion_sem')}>
                        <Image src="https://i.ibb.co/GvLDBTQs/Dise-o-sin-t-tulo-8-1.png" alt="Instructor Gestion Icon" width={32} height={32} />
                        <span className='text-xs'>Instructor</span>
                        <span className='text-xs'>Gestión</span>
                    </Button>
                )
            }
            if (role === 'Facciones Legales') {
              return (
                  <Button key={role} variant="ghost" className="text-center h-auto py-1 flex flex-col items-center gap-1" onClick={() => handleRoleChange('facciones_legales')}>
                      <Image src="https://i.ibb.co/QvhjS6YL/Facciones-Legales-3.png" alt="Facciones Legales Icon" width={32} height={32} />
                      <span className='text-xs'>Facciones</span>
                      <span className='text-xs'>Legales</span>
                  </Button>
              )
          }
            return null;
        })}
        {hasDireccionRole && viewToRoleName[currentView] !== 'Responsable Faccion' && (
            <Button variant="ghost" className="h-auto py-1 flex flex-col gap-1 text-center" onClick={() => handleRoleChange('responsable_faccion')}>
                <Image src="https://i.ibb.co/TBdW8Bx3/Dise-o-sin-t-tulo-11-1.png" alt="Responsable Faccion Icon" width={32} height={32} />
                <span className='text-xs leading-tight'>Responsable<br/>Faccion</span>
            </Button>
        )}


        {hasDireccionRole && (
            <>
                <Button variant="ghost" className="h-auto py-1 flex flex-col gap-1 text-center" onClick={() => onSelectSubRole('Actividades Extr.')}>
                    <Image src="https://i.ibb.co/B2s2QKWb/Dise-o-sin-t-tulo-12-1.png" alt="Actividades Extraescolares Icon" width={32} height={32} />
                    <span className='text-xs leading-tight'>Actividades<br/>Extr. (coord)</span>
                </Button>
                <Button variant="ghost" className="h-auto py-1 flex flex-col gap-1 text-center" onClick={() => onSelectSubRole('Jefaturas')}>
                    <Image src="https://i.ibb.co/v4HF63Dc/Dise-o-sin-t-tulo-13-1.png" alt="Jefaturas Icon" width={32} height={32} />
                    <span className='text-xs leading-tight'>Jefaturas<br/>(Instr)</span>
                </Button>
                <Button variant="ghost" className="h-auto py-1 flex flex-col gap-1 text-center" onClick={() => onSelectSubRole('Secretaría')}>
                    <Image src="https://i.ibb.co/gZvGkphp/Dise-o-sin-t-tulo-14-1.png" alt="Secretaría Icon" width={32} height={32} />
                    <span className='text-xs leading-tight'>Secretaría</span>
                </Button>
            </>
        )}
      </div>
    </header>
  );
}
