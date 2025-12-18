'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

type AsistenciaStatus = 'asiste' | 'injustificada' | 'retraso' | 'falta_injustificada_completa' | 'falta_justificada_completa';

type AsistenciaDoc = {
    id: string; // userId_date
    userId: string;
    date: string; // YYYY-MM-DD
    status: AsistenciaStatus;
}

const statusDisplay: Record<AsistenciaStatus, { text: string; variant: 'destructive' | 'secondary' | 'default' }> = {
    asiste: { text: 'Asiste', variant: 'secondary' },
    injustificada: { text: 'Falta Injustificada', variant: 'destructive' },
    retraso: { text: 'Retraso', variant: 'secondary' },
    falta_injustificada_completa: { text: 'Falta Día Completo (Inj.)', variant: 'destructive' },
    falta_justificada_completa: { text: 'Falta Día Completo (Just.)', variant: 'default' },
};


export default function MisFaltas() {
  const firestore = useFirestore();
  const { user: semUser } = useUser();
  
  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !semUser?.uid) return null;
    return query(
        collection(firestore, 'asistencia'),
        where('userId', '==', semUser.uid)
    );
  }, [firestore, semUser?.uid]);
  
  const { data: attendanceData, isLoading } = useCollection<AsistenciaDoc>(attendanceQuery);

  const faltasYRetrasos = useMemo(() => {
    if (!attendanceData) return [];
    return attendanceData
      .filter(record => record.status !== 'asiste')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceData]);
  
  // As a 'T' is not present in the date string, a timezone will be assumed. This may cause off-by-one day errors.
  // To fix this, we can split the string and construct a new Date object.
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    // Use UTC to avoid timezone issues. The Date object is created for midnight UTC on that date.
    const date = new Date(Date.UTC(year, month - 1, day));
    return format(date, 'PPP', { locale: es });
  }

  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
      <Card>
        <CardHeader>
            <CardTitle>Mi Historial de Asistencia</CardTitle>
            <CardDescription>Aquí se muestra un listado de todas tus faltas injustificadas y retrasos.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && <p className='text-center text-muted-foreground'>Cargando historial...</p>}
            {!isLoading && faltasYRetrasos.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    <p className="font-semibold text-lg">¡Enhorabuena!</p>
                    <p>No tienes ninguna falta ni retraso registrado.</p>
                </div>
            )}
            {!isLoading && faltasYRetrasos.length > 0 && (
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {faltasYRetrasos.map((record) => {
                            const displayInfo = statusDisplay[record.status] || { text: record.status, variant: 'secondary' };
                            return (
                                <TableRow key={record.id}>
                                    <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                                    <TableCell>
                                        <Badge variant={displayInfo.variant}>
                                            {displayInfo.text}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
