'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
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


type FeedbackStatus = 'positivo' | 'negativo';

type AsistenciaDoc = {
    id: string; // userId_date
    date: string; // YYYY-MM-DD
    userId: string;
    feedback?: FeedbackStatus;
};

type UserDoc = {
    id: string;
    username: string;
}

export default function RegistrosFeedback() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
    
    const feedbackQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'asistencia'),
            where('feedback', 'in', ['positivo', 'negativo'])
        );
    }, [firestore]);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);

    const { data: feedbackData, isLoading: isLoadingFeedback } = useCollection<AsistenciaDoc>(feedbackQuery);
    const { data: usersData, isLoading: isLoadingUsers } = useCollection<UserDoc>(usersQuery);

    useEffect(() => {
        if (usersData) {
            const newMap = new Map<string, string>();
            usersData.forEach(user => newMap.set(user.id, user.username));
            setUserMap(newMap);
        }
    }, [usersData]);

    const sortedFeedback = useMemo(() => {
        if (!feedbackData) return [];
        return feedbackData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [feedbackData]);

    const handleDeleteFeedback = async (record: AsistenciaDoc) => {
        if (!firestore) return;
        const docRef = doc(firestore, 'asistencia', record.id);
        try {
            await updateDoc(docRef, { feedback: null });
            toast({ title: 'Feedback eliminado', description: `Se ha eliminado el feedback para ${userMap.get(record.userId)} del día ${formatDate(record.date)}.` });
        } catch (error) {
            console.error("Error al eliminar el feedback:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el feedback.' });
        }
    };
    
    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        return format(date, 'PPP', { locale: es });
    };
    
    const isLoading = isLoadingFeedback || isLoadingUsers;

    return (
        <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
            <Card>
                <CardHeader>
                    <CardTitle>Registros de Feedback</CardTitle>
                    <CardDescription>Aquí puedes ver y gestionar todos los feedbacks positivos y negativos registrados.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && <p className='text-center text-muted-foreground'>Cargando registros...</p>}
                    {!isLoading && sortedFeedback.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No hay registros de feedback para mostrar.</p>
                        </div>
                    )}
                    {!isLoading && sortedFeedback.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Alumno</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Feedback</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedFeedback.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">{userMap.get(record.userId) || record.userId}</TableCell>
                                        <TableCell>{formatDate(record.date)}</TableCell>
                                        <TableCell>
                                            {record.feedback === 'positivo' ? (
                                                <ThumbsUp className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <ThumbsDown className="h-5 w-5 text-red-600" />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" title="Eliminar feedback">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción eliminará el feedback de este registro de asistencia, pero no la falta o retraso si lo hubiera.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteFeedback(record)}>
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
