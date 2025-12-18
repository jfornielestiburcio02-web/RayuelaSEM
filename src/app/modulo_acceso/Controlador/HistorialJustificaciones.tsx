'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { serverTimestamp } from 'firebase/firestore';

type Justificacion = {
  motivo: string;
  descripcion?: string;
}

type AsistenciaDoc = {
    id: string; // userId_date
    date: string; // YYYY-MM-DD
    justificacion?: Justificacion;
}

export default function HistorialJustificaciones() {
  const firestore = useFirestore();
  const { user: semUser } = useUser();
  const { toast } = useToast();
  
  const justificacionesQuery = useMemoFirebase(() => {
    if (!firestore || !semUser?.uid) return null;
    return query(
        collection(firestore, 'asistencia'),
        where('userId', '==', semUser.uid),
        where('justificacion', '!=', null)
    );
  }, [firestore, semUser?.uid]);
  
  const { data: justificaciones, isLoading } = useCollection<AsistenciaDoc>(justificacionesQuery);

  const sortedJustificaciones = useMemo(() => {
    if (!justificaciones) return [];
    return justificaciones.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [justificaciones]);

  const handleDeleteJustificacion = async (asistenciaId: string) => {
    if (!firestore) return;

    const asistenciaRef = doc(firestore, 'asistencia', asistenciaId);
    try {
        await updateDoc(asistenciaRef, {
            justificacion: null // O usa deleteField() si usas Admin SDK en backend
        });
        toast({
            title: 'Justificación eliminada',
            description: 'La justificación ha sido eliminada del registro de asistencia.',
        });
    } catch (error) {
        console.error("Error al eliminar la justificación: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo eliminar la justificación.',
        });
    }
  };
  
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return format(date, 'PPP', { locale: es });
  };

  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
      <Card>
        <CardHeader>
            <CardTitle>Historial de Justificaciones</CardTitle>
            <CardDescription>Aquí puedes ver y gestionar todas las ausencias que has justificado.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && <p className='text-center text-muted-foreground'>Cargando historial...</p>}
            {!isLoading && sortedJustificaciones.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    <p>No has enviado ninguna justificación todavía.</p>
                </div>
            )}
            {!isLoading && sortedJustificaciones.length > 0 && (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedJustificaciones.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                                <TableCell>{record.justificacion?.motivo}</TableCell>
                                <TableCell>{record.justificacion?.descripcion || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" title="Eliminar justificación">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción eliminará la justificación del registro. La falta seguirá constando como "Injustificada" hasta que el instructor la modifique. No podrás deshacer esta acción.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteJustificacion(record.id)}>
                                                Eliminar
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
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
