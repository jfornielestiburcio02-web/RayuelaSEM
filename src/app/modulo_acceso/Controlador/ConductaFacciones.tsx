'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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

const FeedbackTable = ({ user }: { user: UserDoc }) => {
    const firestore = useFirestore();
    
    const feedbackQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'asistencia'),
            where('userId', '==', user.id),
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
        <Card>
            <CardHeader>
                <CardTitle>Historial de Conducta de {user.username}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && <p className='text-center text-muted-foreground'>Cargando historial...</p>}
                {!isLoading && (!feedbackData || feedbackData.length === 0) && (
                    <div className="text-center text-muted-foreground py-8">
                        <p>Este alumno no tiene ningún feedback registrado.</p>
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
                                            <div className="flex items-center gap-2 text-green-600">
                                                <ThumbsUp className="h-5 w-5" />
                                                <span>Positivo</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-600">
                                                <ThumbsDown className="h-5 w-5" />
                                                <span>Negativo</span>
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
    );
};


export default function ConductaFacciones() {
    const firestore = useFirestore();
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    const usersQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'users'), where('role', 'array-contains', 'SEM')) : null,
      [firestore]
    );
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserDoc>(usersQuery);

    const selectedUser = useMemo(() => users?.find(u => u.id === selectedUserId), [users, selectedUserId]);

    return (
        <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
            {!selectedUser ? (
                 <Card className="max-w-xl mx-auto mt-10">
                    <CardHeader>
                        <CardTitle>Registro de Conducta</CardTitle>
                        <CardDescription>
                            Selecciona un alumno para ver su historial de feedback (positivo y negativo).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select onValueChange={setSelectedUserId} disabled={isLoadingUsers}>
                             <SelectTrigger>
                                <SelectValue placeholder={isLoadingUsers ? "Cargando alumnos..." : "Selecciona un alumno..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {users?.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.username}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Button variant="outline" onClick={() => setSelectedUserId('')} className="mb-4">Volver a la selección</Button>
                    <FeedbackTable user={selectedUser} />
                </>
            )}
        </div>
    );
}
