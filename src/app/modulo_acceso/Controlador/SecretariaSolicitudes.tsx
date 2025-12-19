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

type InscripcionDoc = {
    id: string; // {userId}_{tramiteId}
    userName: string;
    tramiteName: string;
    status: 'pendiente' | 'aprobado' | 'rechazado';
    inscritoEn: Timestamp;
};

export default function SecretariaSolicitudes() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const solicitudesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'inscripcionesTramites'), orderBy('inscritoEn', 'desc'));
  }, [firestore]);
  
  const { data: solicitudes, isLoading } = useCollection<InscripcionDoc>(solicitudesQuery);

  const handleUpdateStatus = async (id: string, newStatus: 'aprobado' | 'rechazado') => {
    if (!firestore) return;
    const docRef = doc(firestore, 'inscripcionesTramites', id);
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

  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
      <Card>
        <CardHeader>
            <CardTitle>Solicitudes Teletramitadas</CardTitle>
            <CardDescription>Aquí puedes ver y gestionar las inscripciones de los ciudadanos a los trámites.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && <p className='text-center text-muted-foreground'>Cargando solicitudes...</p>}
            {!isLoading && (!solicitudes || solicitudes.length === 0) && (
                <div className="text-center text-muted-foreground py-8">
                    <p>No hay solicitudes pendientes.</p>
                </div>
            )}
            {!isLoading && solicitudes && solicitudes.length > 0 && (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Ciudadano</TableHead>
                            <TableHead>Trámite</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {solicitudes.map((solicitud) => (
                            <TableRow key={solicitud.id}>
                                <TableCell className="font-medium whitespace-nowrap">{formatDate(solicitud.inscritoEn)}</TableCell>
                                <TableCell>{solicitud.userName}</TableCell>
                                <TableCell>{solicitud.tramiteName}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        solicitud.status === 'aprobado' ? 'default' :
                                        solicitud.status === 'rechazado' ? 'destructive' :
                                        'secondary'
                                    } className={cn(solicitud.status === 'aprobado' && 'bg-green-600')}>
                                        {solicitud.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    {solicitud.status === 'pendiente' ? (
                                        <>
                                            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleUpdateStatus(solicitud.id, 'aprobado')}>Aprobar</Button>
                                            <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleUpdateStatus(solicitud.id, 'rechazado')}>Rechazar</Button>
                                        </>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Gestionado</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
