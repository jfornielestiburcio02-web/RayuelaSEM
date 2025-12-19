'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"

type SolicitudDoc = {
    id: string;
    nombre: string;
    apellidos: string;
    dni: string;
    fechaNacimiento: string;
    usuarioDiscord: string;
    fotoUrl?: string;
    sexo: "Hombre" | "Mujer" | "Otro";
    nacionalidad: string;
    quiereAccederSem: boolean;
    creadoEn: Timestamp;
    status: 'pendiente' | 'aprobado' | 'rechazado';
};

export default function SolicitudesAccesoSem() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const solicitudesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'solicitudesAcceso'), orderBy('creadoEn', 'desc'));
    }, [firestore]);

    const { data: solicitudes, isLoading } = useCollection<SolicitudDoc>(solicitudesQuery);
    
    const handleUpdateStatus = async (id: string, newStatus: 'aprobado' | 'rechazado') => {
        if (!firestore) return;
        const docRef = doc(firestore, 'solicitudesAcceso', id);
        try {
            await updateDoc(docRef, { status: newStatus });
            toast({
                title: 'Estado actualizado',
                description: `La solicitud ha sido marcada como ${newStatus}.`,
            });
        } catch (error) {
            console.error("Error al actualizar estado:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado de la solicitud.' });
        }
    };


    const formatDate = (timestamp: Timestamp | null | undefined) => {
        if (!timestamp) return 'Fecha desconocida';
        return format(timestamp.toDate(), 'PPP p', { locale: es });
    };
    
    const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').toUpperCase();


  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
      <Card>
        <CardHeader>
            <CardTitle>Solicitudes de Acceso al SEM</CardTitle>
            <CardDescription>Aquí puedes ver y gestionar las solicitudes de los nuevos aspirantes.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && <p className='text-center text-muted-foreground'>Cargando solicitudes...</p>}
            {!isLoading && (!solicitudes || solicitudes.length === 0) && (
                <div className="text-center text-muted-foreground py-8">
                    <p>No hay solicitudes pendientes.</p>
                </div>
            )}
            {!isLoading && solicitudes && solicitudes.length > 0 && (
                <Accordion type="single" collapsible className="w-full">
                    {solicitudes.map((solicitud) => (
                      <AccordionItem value={solicitud.id} key={solicitud.id}>
                        <AccordionTrigger>
                            <div className='flex flex-1 items-center gap-4 text-sm text-left'>
                                <span className='w-1/4 font-medium'>{solicitud.nombre} {solicitud.apellidos}</span>
                                <span className='w-1/4 text-muted-foreground'>{solicitud.dni}</span>
                                <span className='w-1/4 text-muted-foreground'>{formatDate(solicitud.creadoEn)}</span>
                                <div className='w-1/4 flex justify-end pr-4'>
                                    <Badge variant={
                                        solicitud.status === 'aprobado' ? 'default' :
                                        solicitud.status === 'rechazado' ? 'destructive' :
                                        'secondary'
                                    } className={cn(solicitud.status === 'aprobado' && 'bg-green-600')}>
                                        {solicitud.status}
                                    </Badge>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1 flex flex-col items-center justify-center">
                                        <Avatar className="w-24 h-24 mb-2">
                                            <AvatarImage src={solicitud.fotoUrl} />
                                            <AvatarFallback className="text-3xl">{getInitials(solicitud.nombre)}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-semibold">{solicitud.usuarioDiscord}</p>
                                    </div>
                                    <div className="md:col-span-2 grid grid-cols-2 gap-4 text-sm">
                                       <div><p className="font-semibold">Nombre Completo</p><p>{solicitud.nombre} {solicitud.apellidos}</p></div>
                                       <div><p className="font-semibold">DNI</p><p>{solicitud.dni}</p></div>
                                       <div><p className="font-semibold">Fecha Nacimiento</p><p>{solicitud.fechaNacimiento}</p></div>
                                       <div><p className="font-semibold">Sexo</p><p>{solicitud.sexo}</p></div>
                                       <div><p className="font-semibold">Nacionalidad</p><p>{solicitud.nacionalidad}</p></div>
                                       <div><p className="font-semibold">Accede al SEM</p><p>{solicitud.quiereAccederSem ? 'Sí' : 'No'}</p></div>
                                    </div>
                               </div>
                                <div className="text-right space-x-2 mt-6">
                                    {solicitud.status === 'pendiente' ? (
                                        <>
                                            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleUpdateStatus(solicitud.id, 'aprobado')}>Aprobar</Button>
                                            <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleUpdateStatus(solicitud.id, 'rechazado')}>Rechazar</Button>
                                        </>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Solicitud ya gestionada.</span>
                                    )}
                                </div>
                           </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
