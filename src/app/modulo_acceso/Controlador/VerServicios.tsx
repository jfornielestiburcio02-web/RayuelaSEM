'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { format, formatDistanceStrict } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UserDoc = {
  id: string;
  username: string;
};

type ServicioDoc = {
    id: string;
    semUserId: string;
    semUserName: string;
    startTime: Timestamp;
    endTime?: Timestamp;
};

export default function VerServicios() {
  const firestore = useFirestore();
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const usersQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'users'), where('role', 'array-contains', 'SEM')) : null,
    [firestore]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserDoc>(usersQuery);
  
  const serviciosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (selectedUserId) {
      return query(
        collection(firestore, 'servicios'),
        where('semUserId', '==', selectedUserId),
        orderBy('startTime', 'desc')
      );
    }
    return query(collection(firestore, 'servicios'), orderBy('startTime', 'desc'));
  }, [firestore, selectedUserId]);
  
  const { data: servicios, isLoading: isLoadingServicios } = useCollection<ServicioDoc>(serviciosQuery);

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return '-';
    return format(timestamp.toDate(), 'PPP p', { locale: es });
  };

  const calculateDuration = (start?: Timestamp, end?: Timestamp) => {
      if (!start || !end) return 'En curso';
      return formatDistanceStrict(end.toDate(), start.toDate(), { locale: es, unit: 'minute' });
  }

  const isLoading = isLoadingServicios || isLoadingUsers;

  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
      <Card>
        <CardHeader>
            <CardTitle>Historial de Servicios</CardTitle>
            <CardDescription>Aquí puedes ver todos los turnos de servicio registrados por los usuarios SEM.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-4 mb-6">
                <label htmlFor="user-select" className="font-medium shrink-0">De:</label>
                <Select onValueChange={setSelectedUserId} value={selectedUserId}>
                    <SelectTrigger id="user-select" className="w-full max-w-sm">
                        <SelectValue placeholder="Todos los alumnos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">Todos los alumnos</SelectItem>
                        {users?.map(user => (
                            <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isLoading && <p className='text-center text-muted-foreground'>Cargando servicios...</p>}
            {!isLoading && (!servicios || servicios.length === 0) && (
                <div className="text-center text-muted-foreground py-8">
                    <p>No se han registrado servicios para la selección actual.</p>
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
