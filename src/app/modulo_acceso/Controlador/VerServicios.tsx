'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { format, formatDistanceStrict } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ServicioDoc = {
    id: string;
    semUserId: string;
    semUserName: string;
    startTime: Timestamp;
    endTime?: Timestamp;
};

export default function VerServicios() {
  const firestore = useFirestore();
  
  const serviciosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'servicios'), orderBy('startTime', 'desc'));
  }, [firestore]);
  
  const { data: servicios, isLoading } = useCollection<ServicioDoc>(serviciosQuery);

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return '-';
    return format(timestamp.toDate(), 'PPP p', { locale: es });
  };

  const calculateDuration = (start?: Timestamp, end?: Timestamp) => {
      if (!start || !end) return 'En curso';
      return formatDistanceStrict(end.toDate(), start.toDate(), { locale: es, unit: 'minute' });
  }

  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
      <Card>
        <CardHeader>
            <CardTitle>Historial de Servicios</CardTitle>
            <CardDescription>Aquí puedes ver todos los turnos de servicio registrados por los usuarios SEM.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && <p className='text-center text-muted-foreground'>Cargando servicios...</p>}
            {!isLoading && (!servicios || servicios.length === 0) && (
                <div className="text-center text-muted-foreground py-8">
                    <p>No se han registrado servicios todavía.</p>
                </div>
            )}
            {!isLoading && servicios && servicios.length > 0 && (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuario SEM</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Inicio</TableHead>
                            <TableHead>Fin</TableHead>
                            <TableHead>Duración</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {servicios.map((servicio) => (
                            <TableRow key={servicio.id}>
                                <TableCell className="font-medium">{servicio.semUserName}</TableCell>
                                <TableCell>{format(servicio.startTime.toDate(), 'PPP', { locale: es })}</TableCell>
                                <TableCell>{format(servicio.startTime.toDate(), 'p', { locale: es })}</TableCell>
                                <TableCell>{servicio.endTime ? format(servicio.endTime.toDate(), 'p', { locale: es }) : 'En curso'}</TableCell>
                                <TableCell>{calculateDuration(servicio.startTime, servicio.endTime)}</TableCell>
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
