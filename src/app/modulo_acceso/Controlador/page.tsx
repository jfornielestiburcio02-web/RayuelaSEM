'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import DireccionSidebar from './DireccionSidebar';
import InstructorSidebar from './InstructorSidebar';
import SemSidebar from './SemSidebar';
import CrearUsuarioForm from './CrearUsuarioForm';
import EditarUsuarios from './EditarUsuarios';
import FaltasPorMateria from './FaltasPorMateria';
import MisFaltas from './MisFaltas';
import JustificarAusencias from './JustificarAusencias';
import DireccionHeader from './DireccionHeader';
import Image from 'next/image';
import HistorialJustificaciones from './HistorialJustificaciones';
import CrearInformeForm from './CrearInformeForm';
import InformesEnviados from './InformesEnviados';
import DesignarRoles from './DesignarRoles';
import GestionFaltas from './GestionFaltas';
import ServicioSEM from './ServicioSEM';
import VerServicios from './VerServicios';
import CrearAnuncioForm from './CrearAnuncioForm';
import VerAnuncios from './VerAnuncios';
import RegistrosFeedback from './RegistrosFeedback';
import MisFeedbacks from './MisFeedbacks';
import { Button } from '@/components/ui/button';
import PersonalAbsentista from './PersonalAbsentista';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import ConfiguracionUsuario from './ConfiguracionUsuario';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert } from 'lucide-react';
import FaccionesLegalesSidebar from './FaccionesLegalesSidebar';
import FaltasAsistenciaFacciones from './FaltasAsistenciaFacciones';
import ConductaFacciones from './ConductaFacciones';
import ExpulsarUsuarioForm from './ExpulsarUsuarioForm';


const roleToViewMap: Record<string, string> = {
    'SEM': 'sem',
    'Instructor': 'instructor',
    'Instructor Gestion': 'gestion_sem',
    'Dirección': 'direccion',
    'Facciones Legales': 'facciones_legales',
    'Ciudadano': 'ciudadano',
};

const viewToRoleMap: Record<string, string> = {
    'sem': 'SEM',
    'instructor': 'Instructor',
    'gestion_sem': 'Instructor Gestion',
    'direccion': 'Dirección',
    'responsable_faccion': 'Dirección', // Special case
    'facciones_legales': 'Facciones Legales',
    'ciudadano': 'Ciudadano',
};

type UserProfile = {
  role: string[];
};

function LoadingScreen() {
    return (
        <div className="flex w-full h-screen items-center justify-center bg-white dark:bg-gray-900">
            <Image
                src="https://i.ibb.co/DPCdTsLC/b4d657e7ef262b88eb5f7ac021edda87-w200.gif"
                alt="Cargando..."
                width={100}
                height={100}
                unoptimized
            />
        </div>
    );
}

function ControladorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get('view') || 'main';

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserProfile>(userDocRef);
  
  const [direccionActiveView, setDireccionActiveView] = useState<'main' | 'createUser' | 'editUser' | 'subRole' | 'crearMensaje' | 'bandejaDeEntrada' | 'configuracion'>('main');
  const [subRoleView, setSubRoleView] = useState('');

  const [instructorActiveView, setInstructorActiveView] = useState<'main' | 'faltasPorMateria' | 'informesEnviados' | 'gestionFaltas' | 'verServicios' | 'crearAnuncio' | 'registrosFeedback' | 'bandejaDeEntrada' | 'configuracion'>('main');
  
  const [semActiveView, setSemActiveView] = useState<'anuncios' | 'misFaltas' | 'nuevaJustificacion' | 'historialJustificaciones' | 'crearInforme' | 'servicio' | 'misFeedbacks' | 'mensajeria' | 'configuracion'>('anuncios');

  const [gestionSemActiveView, setGestionSemActiveView] = useState<'main' | 'personalAbsentista'>('main');
  
  const [faccionesLegalesActiveView, setFaccionesLegalesActiveView] = useState<'expedientesAbsentistas' | 'faltasAsistencia' | 'conducta' | 'expulsarUsuario' | 'enviarMensaje' | 'bandejaDeEntrada'>('expedientesAbsentistas');

  const [showConductasAlert, setShowConductasAlert] = useState(false);


  useEffect(() => {
    // Wait for all user data to finish loading.
    if (isUserLoading || isUserDataLoading) {
        return;
    }

    // If loading is done and there is no user, redirect to login.
    if (!user) {
        router.push('/modulo_acceso/identificacion');
        return;
    }

    // If there is a user but no role data yet, wait.
    if (!userData) {
      return;
    }

    const userRoles = userData.role || [];
    const requiredRoleForView = viewToRoleMap[view];

    // If the user does not have the required role for the current view...
    if (requiredRoleForView && !userRoles.includes(requiredRoleForView)) {
        // Find the first valid role the user *does* have.
        const firstValidRole = userRoles.find(role => roleToViewMap[role]);
        
        // If they have a valid role, redirect them to that role's view.
        if (firstValidRole) {
            router.push(`/modulo_acceso/Controlador?view=${roleToViewMap[firstValidRole]}`);
        } else {
            // If they have no valid roles, send them back to the container page.
            router.push('/modulo_acceso/Contenedor');
        }
    }
  }, [view, user, userData, isUserLoading, isUserDataLoading, router]);


  useEffect(() => {
    // Reset active views when the main 'view' prop changes
    if (view === 'direccion') {
        setDireccionActiveView('main');
        setSubRoleView('');
    } else if (view === 'instructor') {
        setInstructorActiveView('main');
    } else if (view === 'sem') {
        setSemActiveView('anuncios');
    } else if (view === 'gestion_sem') {
        setGestionSemActiveView('main');
    } else if (view === 'facciones_legales') {
        setFaccionesLegalesActiveView('expedientesAbsentistas');
    }
  }, [view]);


  const handleSubRoleClick = (subRole: 'Actividades Extr.' | 'Jefaturas' | 'Secretaría' | 'main') => {
    if (subRole === 'main') {
      setDireccionActiveView('main');
      setSubRoleView('');
    } else {
      setDireccionActiveView('subRole');
      setSubRoleView(subRole);
    }
  }
  
  const handleDireccionSidebarSelection = (option: 'main' | 'createUser' | 'editUser' | 'crearMensaje' | 'bandejaDeEntrada') => {
      setDireccionActiveView(option);
      setSubRoleView('');
  }

  const handleInstructorSidebarSelection = (option: 'main' | 'faltasPorMateria' | 'informesEnviados' | 'gestionFaltas' | 'verServicios' | 'crearAnuncio' | 'registrosFeedback' | 'bandejaDeEntrada') => {
      setInstructorActiveView(option);
  }

  const handleSemSidebarSelection = (option: 'anuncios' | 'misFaltas' | 'nuevaJustificacion' | 'historialJustificaciones' | 'crearInforme' | 'servicio' | 'misFeedbacks' | 'mensajeria') => {
    setSemActiveView(option);
  }
  
  const handleFaccionesLegalesSidebarSelection = (option: 'expedientesAbsentistas' | 'faltasAsistencia' | 'conducta' | 'expulsarUsuario' | 'enviarMensaje' | 'bandejaDeEntrada') => {
      setFaccionesLegalesActiveView(option);
  }


  const openConfig = () => {
    if (view === 'direccion') setDireccionActiveView('configuracion');
    if (view === 'instructor') setInstructorActiveView('configuracion');
    if (view === 'sem') setSemActiveView('configuracion');
  }

  const renderDireccionContent = () => {
    switch (direccionActiveView) {
      case 'createUser':
        return <CrearUsuarioForm />;
      case 'editUser':
        return <EditarUsuarios />;
      case 'crearMensaje':
        return <CrearAnuncioForm />;
      case 'bandejaDeEntrada':
        return <VerAnuncios />;
      case 'configuracion':
        return <ConfiguracionUsuario />;
      case 'subRole':
        return (
            <div className="w-full flex-grow flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-3xl font-bold">Vista de {subRoleView}</h2>
                <p>Contenido para la sección de {subRoleView} irá aquí.</p>
                <Button onClick={() => handleSubRoleClick('main')} className="mt-4">Volver al Panel de Dirección</Button>
            </div>
        )
      default:
        return (
          <div className="w-full flex-grow flex flex-col items-center justify-center text-center p-4">
            <h2 className="text-3xl font-bold mb-8">Panel de Dirección</h2>
            <p>Selecciona una opción del menú lateral o del encabezado para empezar.</p>
          </div>
        );
    }
  };

  const renderInstructorContent = () => {
    switch (instructorActiveView) {
        case 'faltasPorMateria':
            return <FaltasPorMateria />;
        case 'gestionFaltas':
            return <GestionFaltas />;
        case 'informesEnviados':
            return <InformesEnviados />;
        case 'verServicios':
            return <VerServicios />;
        case 'crearAnuncio':
            return <CrearAnuncioForm />;
        case 'registrosFeedback':
            return <RegistrosFeedback />;
        case 'bandejaDeEntrada':
            return <VerAnuncios />;
        case 'configuracion':
            return <ConfiguracionUsuario />;
        default:
            return (
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <h2 className="text-3xl font-bold">Panel de Instructor</h2>
                    <p>Bienvenido. Selecciona una opción del menú lateral.</p>
                </div>
            );
    }
  }

  const renderSemContent = () => {
    switch (semActiveView) {
        case 'misFaltas':
            return <MisFaltas />;
        case 'nuevaJustificacion':
            return <JustificarAusencias />;
        case 'historialJustificaciones':
            return <HistorialJustificaciones />;
        case 'crearInforme':
            return <CrearInformeForm />;
        case 'servicio':
            return <ServicioSEM />;
        case 'anuncios':
             return <VerAnuncios />;
        case 'misFeedbacks':
            return <MisFeedbacks />;
        case 'mensajeria':
            return <CrearAnuncioForm />;
        case 'configuracion':
            return <ConfiguracionUsuario />;
        default:
            return (
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <h2 className="text-3xl font-bold">Panel de SEM</h2>
                    <p>Bienvenido. Selecciona una opción del menú lateral.</p>
                </div>
            );
    }
  }
  
  const renderGestionSemContent = () => {
      switch(gestionSemActiveView) {
          case 'personalAbsentista':
              return <PersonalAbsentista />;
          default:
              return (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                    <h2 className="text-3xl font-bold">Panel de Instructor Gestión</h2>
                    <p className='mt-2 text-muted-foreground'>Bienvenido. Selecciona una opción del menú lateral para gestionar los expedientes.</p>
                </div>
              )
      }
  }
  
  const renderFaccionesLegalesContent = () => {
    switch(faccionesLegalesActiveView) {
        case 'expedientesAbsentistas':
            return <PersonalAbsentista />;
        case 'faltasAsistencia':
            return <FaltasAsistenciaFacciones />;
        case 'conducta':
            return <ConductaFacciones />;
        case 'expulsarUsuario':
            return <ExpulsarUsuarioForm />;
        case 'enviarMensaje':
            return <CrearAnuncioForm />;
        case 'bandejaDeEntrada':
            return <VerAnuncios />;
        default:
            return (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                  <h2 className="text-3xl font-bold">Panel de Facciones Legales</h2>
                  <p className='mt-2 text-muted-foreground'>Bienvenido. Selecciona una opción del menú lateral.</p>
              </div>
            )
    }
}


  const renderContent = () => {
    if (isUserLoading || isUserDataLoading || !user || !userData) {
        return <LoadingScreen />;
    }
    
    switch (view) {
      case 'gestion_sem':
        return (
             <div className="flex flex-col w-full h-screen bg-gray-50/50 dark:bg-gray-900/50">
                <DireccionHeader currentView={view} onSelectSubRole={handleSubRoleClick} onOpenConfig={openConfig} />
                <div className="flex flex-grow overflow-hidden">
                    <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col space-y-2 pt-8 shadow-md">
                        <Button variant={gestionSemActiveView === 'personalAbsentista' ? 'secondary': 'ghost'} className="w-full justify-start" onClick={() => setGestionSemActiveView('personalAbsentista')}>Personal Absentista</Button>
                        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setShowConductasAlert(true)}>
                            <ShieldAlert className='h-4 w-4' />
                           Conductas Contrarias / Graves
                        </Button>
                    </div>
                    <div className="flex-grow flex flex-col">
                        <div className="flex-grow overflow-auto">
                            {renderGestionSemContent()}
                        </div>
                    </div>
                </div>
                 <AlertDialog open={showConductasAlert} onOpenChange={setShowConductasAlert}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Página no disponible</AlertDialogTitle>
                        <AlertDialogDescription>
                            Lo lamentamos, esta página no está disponible actualmente.
                            <br />
                            <br />
                            <span className="font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded">Código de error: 87362</span>
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogAction onClick={() => setShowConductasAlert(false)}>Aceptar</AlertDialogAction>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
      
      case 'sem':
        return (
            <div className="flex flex-col w-full h-screen bg-gray-50/50 dark:bg-gray-900/50">
                <DireccionHeader currentView={view} onSelectSubRole={handleSubRoleClick} onOpenConfig={openConfig} />
                <div className="flex flex-grow overflow-hidden">
                    <SemSidebar onSelectOption={handleSemSidebarSelection} />
                    <div className="flex-grow flex flex-col">
                        <div className="flex-grow overflow-auto">
                           {renderSemContent()}
                        </div>
                    </div>
                </div>
            </div>
        );

      case 'instructor':
        return (
            <div className="flex flex-col w-full h-screen bg-gray-50/50 dark:bg-gray-900/50">
                <DireccionHeader currentView={view} onSelectSubRole={handleSubRoleClick} onOpenConfig={openConfig} />
                <div className="flex flex-grow overflow-hidden">
                    <InstructorSidebar onSelectOption={handleInstructorSidebarSelection} />
                    <div className="flex-grow flex flex-col">
                        <div className="flex-grow overflow-auto">
                           {renderInstructorContent()}
                        </div>
                    </div>
                </div>
            </div>
        );

      case 'direccion':
        return (
            <div className="flex flex-col w-full h-screen bg-gray-50/50 dark:bg-gray-900/50">
                <DireccionHeader currentView={view} onSelectSubRole={handleSubRoleClick} onOpenConfig={openConfig} />
                <div className="flex flex-grow overflow-hidden">
                    <DireccionSidebar onSelectOption={handleDireccionSidebarSelection} />
                    <div className="flex-grow flex flex-col">
                        <div className="flex-grow overflow-auto">
                            {renderDireccionContent()}
                        </div>
                    </div>
                </div>
            </div>
        );
      case 'responsable_faccion':
        return (
            <div className="flex flex-col w-full h-screen bg-gray-50/50 dark:bg-gray-900/50">
                <DireccionHeader currentView={view} onSelectSubRole={handleSubRoleClick} onOpenConfig={openConfig} />
                <div className="flex flex-grow overflow-hidden">
                    <div className="flex-grow flex flex-col">
                        <div className="flex-grow overflow-auto">
                            <DesignarRoles />
                        </div>
                    </div>
                </div>
            </div>
        );
      case 'facciones_legales':
        return (
            <div className="flex flex-col w-full h-screen bg-gray-50/50 dark:bg-gray-900/50">
                <DireccionHeader currentView={view} onSelectSubRole={handleSubRoleClick} onOpenConfig={openConfig} />
                <div className="flex flex-grow overflow-hidden">
                    <FaccionesLegalesSidebar onSelectOption={handleFaccionesLegalesSidebarSelection} />
                    <div className="flex-grow flex flex-col">
                        <div className="flex-grow overflow-auto">
                            {renderFaccionesLegalesContent()}
                        </div>
                    </div>
                </div>
            </div>
        );
      case 'ciudadano':
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
      default:
        return (
          <div className="flex-grow flex flex-col items-center justify-center text-center">
            <h2 className="text-3xl font-bold">Página del Controlador</h2>
            <p>Bienvenido. Por favor, selecciona una opción desde la página anterior.</p>
          </div>
        );
    }
  };

  return (
    <main className="flex min-h-screen">
      {renderContent()}
    </main>
  );
}

export default function ControladorPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ControladorContent />
    </Suspense>
  );
}
