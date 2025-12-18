'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

type FeedbackStatus = 'positivo' | 'negativo';

type AsistenciaDoc = {
    id: string; // userId_date
    date: string; // YYYY-MM-DD
    userId: string;
    feedback?: FeedbackStatus;
};

export default function MisFeedbacks() {
    const firestore = useFirestore();
    const { user } = useUser();
    
    const feedbackQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'asistencia'),
            where('userId', '==', user.uid),
            where('feedback', 'in', ['positivo', 'negativo']),
            orderBy('date', 'desc')
        );
    }, [firestore, user]);

    const { data: feedbackData, isLoading } = useCollection<AsistenciaDoc>(feedbackQuery);

    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        return format(date, 'PPP', { locale: es });
    };

    return (
        <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
            <Card>
                <CardHeader>
                    <CardTitle>Mi Historial de Conducta</CardTitle>
                    <CardDescription>Aquí puedes ver el feedback (positivo y negativo) que has recibido.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && <p className='text-center text-muted-foreground'>Cargando historial...</p>}
                    {!isLoading && (!feedbackData || feedbackData.length === 0) && (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No tienes ningún feedback registrado.</p>
                        </div>
                    )}
                    {!isLoading && feedbackData && feedbackData.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Feedback</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feedbackData.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                                        <TableCell>
                                            {record.feedback === 'positivo' ? (
                                                <div className="flex items-center gap-2">
                                                    <ThumbsUp className="h-5 w-5 text-green-600" />
                                                    <span className="text-green-600">Positivo</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <ThumbsDown className="h-5 w-5 text-red-600" />
                                                    <span className="text-red-600">Negativo</span>
                                                </div>
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
