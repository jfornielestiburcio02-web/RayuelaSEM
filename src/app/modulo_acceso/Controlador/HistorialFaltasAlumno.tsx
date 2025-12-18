'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { deleteField } from 'firebase/firestore';

type UserDoc = {
  id: string;
  username: string;
  fotoUrl?: string;
};

type AsistenciaStatus = 'asiste' | 'injustificada' | 'retraso' | 'falta_injustificada_completa' | 'falta_justificada_completa' | 'justificada';

type FeedbackStatus = 'positivo' | 'negativo';

type AsistenciaDoc = {
    id: string;
    date: string;
    status: AsistenciaStatus;
    justificacion?: { motivo: string; descripcion?: string };
    feedback?: FeedbackStatus;
};

type HistorialFaltasAlumnoProps = {
  user: UserDoc;
  onBack: () => void;
};

const statusDisplay: Record<AsistenciaStatus, { text: string; variant: 'destructive' | 'secondary' | 'default' | 'outline' }> = {
    asiste: { text: 'Asiste', variant: 'outline' },
    injustificada: { text: 'Injustificada', variant: 'destructive' },
    retraso: { text: 'Retraso', variant: 'secondary' },
    falta_injustificada_completa: { text: 'Día Completo (Inj.)', variant: 'destructive' },
    falta_justificada_completa: { text: 'Día Completo (Just.)', variant: 'default' },
    justificada: { text: 'Justificada', variant: 'default' },
};

export default function HistorialFaltasAlumno({ user, onBack }: HistorialFaltasAlumnoProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const faltasQuery = useMemoFirebase(() => {
    if (!firestore || !user?.id) return null;
    return query(
        collection(firestore, 'asistencia'),
        where('userId', '==', user.id)
    );
  }, [firestore, user?.id]);
  
  const { data: faltas, isLoading } = useCollection<AsistenciaDoc>(faltasQuery);

  const sortedFaltas = useMemo(() => {
    if (!faltas) return [];
    return faltas.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [faltas]);

  const handleDelete = async (recordId: string, recordDate: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'asistencia', recordId);
    try {
        await deleteDoc(docRef);
        toast({ title: 'Registro Eliminado', description: `Se ha eliminado la falta del ${formatDate(recordDate)}.` });
    } catch (error) {
        console.error("Error al eliminar el registro:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el registro.' });
    }
  };

  const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return format(date, 'PPP', { locale: es });
  };

  const filteredAndSortedRecords = useMemo(() => {
    if (!faltas) return [];
    return faltas
        .filter(record => record.status !== 'asiste')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [faltas]);

  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
      <header className="mb-6 flex items-center justify-between">
          <div className='flex items-center gap-4'>
              <Avatar className="h-12 w-12">
                  <AvatarImage src={user.fotoUrl} alt={user.username} />
                  <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
              </Avatar>
              <div>
                  <h2 className="text-2xl font-bold">Historial de {user.username}</h2>
                  <p className="text-muted-foreground">Gestiona las faltas y retrasos del alumno.</p>
              </div>
          </div>
          <Button variant="outline" onClick={onBack}>Volver a la lista</Button>
      </header>

      <Card>
        <CardContent className='p-0'>
            {isLoading && <p className='p-6 text-center text-muted-foreground'>Cargando historial...</p>}
            {!isLoading && filteredAndSortedRecords.length === 0 && (
                <div className="text-center text-muted-foreground p-8">
                    <p className="font-semibold text-lg">¡Enhorabuena!</p>
                    <p>Este alumno no tiene ninguna falta ni retraso registrado.</p>
                </div>
            )}
            {!isLoading && filteredAndSortedRecords.length > 0 && (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado Actual</TableHead>
                            <TableHead>Justificación</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedRecords.map((record) => {
                            const displayInfo = statusDisplay[record.status] || { text: record.status, variant: 'outline' };
                            const isFullDayAbsence = record.status === 'falta_injustificada_completa' || record.status === 'falta_justificada_completa';
                            
                            return (
                                <TableRow key={record.id}>
                                    <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                                    <TableCell>
                                        <Badge variant={displayInfo.variant}>
                                            {displayInfo.text}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{record.justificacion?.motivo || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    title="Eliminar registro"
                                                    disabled={isFullDayAbsence}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   Esta acción eliminará el registro de falta para este día. Esta acción no se puede deshacer.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(record.id, record.date)}>
                                                    Eliminar
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
