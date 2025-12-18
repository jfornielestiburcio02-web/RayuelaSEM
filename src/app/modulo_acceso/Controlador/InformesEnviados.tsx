'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type InformeDoc = {
    id: string;
    nombrePaciente: string;
    edadEstimada: number;
    procedimientos: string;
    estado: string;
    descripcion: string;
    dni?: string;
    creadoPor: string;
    creadoEn: Timestamp;
};

export default function InformesEnviados() {
  const firestore = useFirestore();
  
  const informesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'informes'), orderBy('creadoEn', 'desc'));
  }, [firestore]);
  
  const { data: informes, isLoading } = useCollection<InformeDoc>(informesQuery);

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return 'Fecha desconocida';
    return format(timestamp.toDate(), 'PPP p', { locale: es });
  };

  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
      <Card>
        <CardHeader>
            <CardTitle>Informes Enviados</CardTitle>
            <CardDescription>Aquí puedes ver todos los informes de pacientes creados por los usuarios SEM.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && <p className='text-center text-muted-foreground'>Cargando informes...</p>}
            {!isLoading && (!informes || informes.length === 0) && (
                <div className="text-center text-muted-foreground py-8">
                    <p>No se han enviado informes todavía.</p>
                </div>
            )}
            {!isLoading && informes && informes.length > 0 && (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Procedimientos</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>DNI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {informes.map((informe) => (
                            <TableRow key={informe.id}>
                                <TableCell className="font-medium whitespace-nowrap">{formatDate(informe.creadoEn)}</TableCell>
                                <TableCell>{informe.nombrePaciente} ({informe.edadEstimada} años)</TableCell>
                                <TableCell>{informe.estado}</TableCell>
                                <TableCell>{informe.procedimientos}</TableCell>
                                <TableCell className="max-w-xs truncate">{informe.descripcion}</TableCell>
                                <TableCell>{informe.dni || '-'}</TableCell>
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
