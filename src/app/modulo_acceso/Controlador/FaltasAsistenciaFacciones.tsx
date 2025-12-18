'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type UserDoc = {
  id: string;
  username: string;
};

type AsistenciaStatus = 'asiste' | 'injustificada' | 'retraso' | 'falta_injustificada_completa' | 'falta_justificada_completa' | 'justificada';

type AsistenciaDoc = {
    id: string;
    date: string;
    status: AsistenciaStatus;
    justificacion?: { motivo: string };
};

const statusMap: Record<AsistenciaStatus, string> = {
    'injustificada': 'Injustificada (parcial)',
    'retraso': 'Retraso',
    'falta_injustificada_completa': 'Injustificada (día completo)',
    'falta_justificada_completa': 'Justificada (día completo)',
    'justificada': 'Justificada (parcial)',
    'asiste': 'Asiste'
};

const AlumnoDashboard = ({ user }: { user: UserDoc }) => {
    const firestore = useFirestore();
    const [filter, setFilter] = useState<'all' | 'just' | 'inj' | 'ret'>('all');
    const [absentismoStartDate, setAbsentismoStartDate] = useState<Date | undefined>(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d;
    });

    const faltasQuery = useMemoFirebase(
        () => firestore ? query(
            collection(firestore, 'asistencia'),
            where('userId', '==', user.id),
            where('status', 'in', ['injustificada', 'retraso', 'falta_injustificada_completa', 'falta_justificada_completa', 'justificada']),
            orderBy('date', 'desc')
        ) : null,
        [firestore, user.id]
    );
    const { data: faltas, isLoading: isLoadingFaltas } = useCollection<AsistenciaDoc>(faltasQuery);

    const filteredFaltas = useMemo(() => {
        if (!faltas) return [];
        switch (filter) {
            case 'inj':
                return faltas.filter(f => f.status === 'injustificada' || f.status === 'falta_injustificada_completa');
            case 'just':
                return faltas.filter(f => f.status === 'falta_justificada_completa' || f.status === 'justificada');
            case 'ret':
                return faltas.filter(f => f.status === 'retraso');
            default:
                return faltas;
        }
    }, [faltas, filter]);

    const absentismoData = useMemo(() => {
        if (!faltas || !absentismoStartDate) return { percentage: 0 };
        const totalDaysInRange = differenceInDays(new Date(), absentismoStartDate) + 1;
        if (totalDaysInRange <= 0) return { percentage: 0 };

        const absencesInRange = faltas.filter(f => {
            const faltaDate = new Date(f.date.replace(/-/g, '\/'));
            return faltaDate >= absentismoStartDate && (f.status === 'injustificada' || f.status === 'falta_injustificada_completa');
        }).length;
        
        const percentage = (absencesInRange / totalDaysInRange) * 100;
        return { percentage: Math.min(100, Math.round(percentage)) };
    }, [faltas, absentismoStartDate]);
    
    return (
        <div className='p-6 space-y-6'>
            <div className='flex justify-between items-start'>
                <div>
                    <h2 className="text-2xl font-bold">Faltas de Asistencia: {user.username}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total de Registros</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{faltas?.length || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Porcentaje de Absentismo (Inj.)</CardTitle>
                         <CardDescription>Desde la fecha seleccionada.</CardDescription>
                    </CardHeader>
                    <CardContent className='flex items-center gap-4'>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !absentismoStartDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {absentismoStartDate ? format(absentismoStartDate, 'PPP', { locale: es }) : <span>Selecciona fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={absentismoStartDate} onSelect={setAbsentismoStartDate} disabled={(date) => date > new Date()} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <div className='text-4xl font-bold'>{absentismoData.percentage}%</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Faltas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-4">
                        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Todos</Button>
                        <Button variant={filter === 'inj' ? 'default' : 'outline'} onClick={() => setFilter('inj')}>Injustificadas</Button>
                        <Button variant={filter === 'just' ? 'default' : 'outline'} onClick={() => setFilter('just')}>Justificadas</Button>
                        <Button variant={filter === 'ret' ? 'default' : 'outline'} onClick={() => setFilter('ret')}>Retrasos</Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Día de Falta</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Justificación</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingFaltas ? (
                                <TableRow><TableCell colSpan={3} className="text-center">Cargando...</TableCell></TableRow>
                            ) : filteredFaltas.length > 0 ? (
                                filteredFaltas.map(falta => (
                                    <TableRow key={falta.id}>
                                        <TableCell className="font-medium">{format(new Date(falta.date.replace(/-/g, '\/')), 'PPP', { locale: es })}</TableCell>
                                        <TableCell>
                                            <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', {
                                                'bg-red-100 text-red-800': falta.status.includes('injustificada'),
                                                'bg-green-100 text-green-800': falta.status.includes('justificada'),
                                                'bg-yellow-100 text-yellow-800': falta.status === 'retraso'
                                            })}>
                                                {statusMap[falta.status] || falta.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>{falta.justificacion?.motivo || '-'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={3} className="text-center">No hay registros para este filtro.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default function FaltasAsistenciaFacciones() {
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
                       <CardTitle>Faltas de Asistencia</CardTitle>
                       <CardDescription>
                           Selecciona un alumno para ver su historial de faltas de asistencia.
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
                    <AlumnoDashboard user={selectedUser} />
                </>
            )}
        </div>
    );
}
