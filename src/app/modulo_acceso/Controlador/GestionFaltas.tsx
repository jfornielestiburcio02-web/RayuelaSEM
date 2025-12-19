'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, getDoc, updateDoc, onSnapshot, writeBatch, deleteDoc, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { format, startOfWeek, addDays, addWeeks, subWeeks, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, MoreHorizontal, Calendar as CalendarIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AbrirExpedienteForm from './AbrirExpedienteForm';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"


type UserDoc = {
  id: string;
  username: string;
  email: string;
  role: string[];
  fotoUrl?: string;
};

type AsistenciaStatus = 'asiste' | 'injustificada' | 'retraso' | 'falta_injustificada_completa' | 'falta_justificada_completa' | 'justificada';

type Justificacion = {
  motivo: string;
  descripcion?: string;
}

type AsistenciaDoc = {
    id: string; // userId_date
    userId: string;
    date: string; // YYYY-MM-DD
    status: AsistenciaStatus;
    recordedBy: string;
    timestamp?: any;
    justificacion?: Justificacion;
}

type ExpedienteDoc = {
    id: string;
    userId: string;
}

// Sub-componente para la nueva vista de Resumen
const ResumenAlumno = ({ 
    selectedUser, 
    onBack, 
    onOpenExpediente 
}: { 
    selectedUser: UserDoc, 
    onBack: () => void, 
    onOpenExpediente: (user: UserDoc) => void 
}) => {
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
            where('userId', '==', selectedUser.id),
            where('status', 'in', ['injustificada', 'retraso', 'falta_injustificada_completa', 'falta_justificada_completa', 'justificada']),
            orderBy('date', 'desc')
        ) : null,
        [firestore, selectedUser.id]
    );
    const { data: faltas, isLoading: isLoadingFaltas } = useCollection<AsistenciaDoc>(faltasQuery);

    const filteredFaltas = useMemo(() => {
        if (!faltas) return [];
        switch (filter) {
            case 'inj':
                return faltas.filter(f => f.status === 'injustificada' || f.status === 'falta_injustificada_completa');
            case 'just':
                return faltas.filter(f => f.status === 'falta_justificada_completa');
            case 'ret':
                return faltas.filter(f => f.status === 'retraso');
            default:
                return faltas;
        }
    }, [faltas, filter]);

    const absentismoData = useMemo(() => {
        if (!faltas || !absentismoStartDate) return { percentage: 0, totalDays: 0 };
        const totalDaysInRange = differenceInDays(new Date(), absentismoStartDate) + 1;
        if (totalDaysInRange <= 0) return { percentage: 0, totalDays: 0 };

        const absencesInRange = faltas.filter(f => {
            const faltaDate = new Date(f.date.replace(/-/g, '\/'));
            return faltaDate >= absentismoStartDate && (f.status === 'injustificada' || f.status === 'falta_injustificada_completa');
        }).length;
        
        const percentage = (absencesInRange / totalDaysInRange) * 100;
        return {
            percentage: Math.min(100, Math.round(percentage)),
            totalDays: totalDaysInRange,
            absences: absencesInRange
        };
    }, [faltas, absentismoStartDate]);
    
    const chartData = useMemo(() => {
        if (!faltas) return [];
        const monthCounts = faltas.reduce((acc, falta) => {
            const month = format(new Date(falta.date.replace(/-/g, '\/')), 'yyyy-MM');
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(monthCounts)
            .map(([month, count]) => ({ month: format(new Date(month), 'MMM yy', {locale: es}), count }))
            .sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    }, [faltas]);


    const statusMap: Record<AsistenciaStatus, string> = {
        'injustificada': 'Injustificada (parcial)',
        'retraso': 'Retraso',
        'falta_injustificada_completa': 'Injustificada (día completo)',
        'falta_justificada_completa': 'Justificada (día completo)',
        'justificada': 'Justificada (parcial)',
        'asiste': 'Asiste'
    };

    return (
        <div className='p-6 space-y-6'>
            <div className='flex justify-between items-start'>
                <div>
                    <h2 className="text-2xl font-bold">Resumen de Faltas: {selectedUser.username}</h2>
                    <p className="text-muted-foreground">Analiza el historial de asistencia del alumno.</p>
                </div>
                <Button variant="outline" onClick={onBack}>Volver a la lista</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total de Registros</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{faltas?.length || 0}</p>
                    </CardContent>
                </Card>
                <Card className='col-span-2'>
                    <CardHeader>
                        <CardTitle>Porcentaje de Absentismo</CardTitle>
                         <CardDescription>Desde la fecha seleccionada hasta hoy.</CardDescription>
                    </CardHeader>
                    <CardContent className='flex items-center gap-4'>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[280px] justify-start text-left font-normal",
                                        !absentismoStartDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {absentismoStartDate ? format(absentismoStartDate, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={absentismoStartDate}
                                    onSelect={setAbsentismoStartDate}
                                    disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <div className='text-4xl font-bold'>{absentismoData.percentage}%</div>
                    </CardContent>
                </Card>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Gráfico de Inactividad</CardTitle>
                    <CardDescription>Número de ausencias registradas por mes.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2 bg-white rounded-lg">
                    <ChartContainer config={{ count: { label: "Faltas", color: "hsl(var(--chart-1))" } }} className="h-[200px] w-full">
                        <BarChart accessibilityLayer data={chartData}>
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                             <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="count" fill="#000" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Faltas</CardTitle>
                    <div className='flex justify-between items-center'>
                        <CardDescription>
                            Aquí se muestran todas las faltas y retrasos registrados para {selectedUser.username}.
                        </CardDescription>
                        <Button onClick={() => onOpenExpediente(selectedUser)}>Abrir Expediente</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-4">
                        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Todos</Button>
                        <Button variant={filter === 'inj' ? 'default' : 'outline'} onClick={() => setFilter('inj')}>Injustificadas</Button>
                        <Button variant={filter === 'just' ? 'default' : 'outline'} onClick={() => setFilter('just')}>Justificadas (Día C.)</Button>
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

export default function GestionFaltas() {
    const firestore = useFirestore();
    const { user: instructor } = useUser();
    const [semUsersMap, setSemUsersMap] = useState<Map<string, UserDoc>>(new Map());
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserDoc | null>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [attendance, setAttendance] = useState<Map<string, AsistenciaDoc>>(new Map());
    const [isJustifyDialogOpen, setIsJustifyDialogOpen] = useState(false);
    const [justificationDate, setJustificationDate] = useState<Date | null>(null);
    const [justificationReason, setJustificationReason] = useState('');
    const { toast } = useToast();
    const [isExpedienteFormOpen, setIsExpedienteFormOpen] = useState(false);
    const [expedienteUser, setExpedienteUser] = useState<UserDoc | null>(null);
    const [activeTab, setActiveTab] = useState<'resumen' | 'calendario'>('resumen');
    const [selectedUserIdForResumen, setSelectedUserIdForResumen] = useState<string>('');

    const usersQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'users'), where('role', 'array-contains', 'SEM')) : null,
      [firestore]
    );
    const { data: usersData } = useCollection<UserDoc>(usersQuery);

    const faltasCompletasQuery = useMemoFirebase(
        () => firestore ? query(
            collection(firestore, 'asistencia'),
            where('status', '==', 'falta_injustificada_completa')
        ) : null,
        [firestore]
    );
    const { data: faltasCompletas, isLoading: isLoadingFaltasCompletas } = useCollection<AsistenciaDoc>(faltasCompletasQuery);

    const getInjustificadasCompletasCount = (userId: string): number => {
        if (!faltasCompletas) return 0;
        return faltasCompletas.filter(falta => falta.userId === userId).length;
    };


    useEffect(() => {
        if (usersData) {
            const newMap = new Map();
            usersData.forEach(user => newMap.set(user.id, user));
            setSemUsersMap(newMap);
            setIsLoadingUsers(false);
        }
    }, [usersData]);

    useEffect(() => {
        if (!selectedUser || !firestore) {
            setAttendance(new Map());
            return;
        }
        const start = currentWeekStart;
        const end = addDays(start, 6); 
        const q = query(collection(firestore, 'asistencia'), 
            where('userId', '==', selectedUser.id),
            where('date', '>=', format(start, 'yyyy-MM-dd')),
            where('date', '<=', format(end, 'yyyy-MM-dd'))
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newAttendance = new Map<string, AsistenciaDoc>();
            snapshot.forEach(doc => {
                const data = doc.data() as AsistenciaDoc;
                newAttendance.set(data.date, data);
            });
            setAttendance(newAttendance);
        });

        return () => unsubscribe();
    }, [selectedUser, currentWeekStart, firestore]);

    const handleAttendanceAction = (day: Date, action: 'inj' | 'just') => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const currentStatus = attendance.get(dateKey)?.status;

        if (action === 'inj') {
            const newStatus = currentStatus === 'falta_injustificada_completa' ? 'asiste' : 'falta_injustificada_completa';
            updateAttendance(day, newStatus);
        } else if (action === 'just') {
            if (currentStatus === 'falta_justificada_completa') {
                updateAttendance(day, 'asiste');
            } else {
                setJustificationDate(day);
                setIsJustifyDialogOpen(true);
            }
        }
    };

    const updateAttendance = async (day: Date, status?: AsistenciaStatus, reason?: string) => {
        if (!selectedUser || !firestore || !instructor) return;
        const dateKey = format(day, 'yyyy-MM-dd');
        const asistenciaId = `${selectedUser.id}_${dateKey}`;
        const docRef = doc(firestore, 'asistencia', asistenciaId);

        try {
            const docSnap = await getDoc(docRef);
            let dataToSet: any = { 
                timestamp: serverTimestamp(),
                recordedBy: instructor.uid,
                userId: selectedUser.id,
                date: dateKey,
             };
             
            if (status) {
                dataToSet.status = status;
                // DO NOT add a justification object here, as that is only for student-submitted justifications
            } else {
                dataToSet.status = 'asiste';
            }
            
            await setDoc(docRef, dataToSet, { merge: true });

            // Cleanup if the record becomes empty
            const updatedDoc = await getDoc(docRef);
            if (updatedDoc.exists()) {
                const data = updatedDoc.data();
                if (data.status === 'asiste' && !data.feedback && !data.justificacion) {
                    await deleteDoc(docRef);
                }
            }

        } catch (error) {
            console.error("Error updating attendance:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la asistencia.' });
        }
    };
    
    const handleJustifySubmit = async () => {
        if (justificationDate) {
            await updateAttendance(justificationDate, 'falta_justificada_completa');
            toast({ title: 'Falta Justificada', description: 'La falta ha sido marcada como justificada.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'No hay fecha para justificar.' });
            return;
        }
        setIsJustifyDialogOpen(false);
        setJustificationReason('');
        setJustificationDate(null);
    };

    const handleOpenExpediente = (user: UserDoc) => {
        setExpedienteUser(user);
        setIsExpedienteFormOpen(true);
    };
    
    const renderResumenView = () => {
        const userForResumen = semUsersMap.get(selectedUserIdForResumen);

        if (userForResumen) {
            return (
                <ResumenAlumno
                    selectedUser={userForResumen}
                    onBack={() => setSelectedUserIdForResumen('')}
                    onOpenExpediente={handleOpenExpediente}
                />
            );
        }
        
        return (
            <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
                 <Card className="max-w-xl mx-auto mt-10">
                    <CardHeader>
                        <CardTitle>Seleccionar Alumno</CardTitle>
                        <CardDescription>
                            Elige un alumno para ver su resumen detallado de faltas y absentismo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select onValueChange={setSelectedUserIdForResumen}>
                             <SelectTrigger>
                                <SelectValue placeholder="Selecciona un alumno..." />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from(semUsersMap.values()).map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.username}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderJustificationIcon = (justificacion?: Justificacion) => {
        if (!justificacion) return null;

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                        <Image 
                            src="https://i.ibb.co/xS30qyTg/2-1.png"
                            alt="Justificado"
                            width={40}
                            height={40}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className='font-bold'>Justificado: {justificacion.motivo}</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    const renderCalendarView = () => {
        const isLoading = isLoadingUsers || isLoadingFaltasCompletas;

        if (!selectedUser) {
            return (
                <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
                    <header className="mb-6">
                        <h2 className="text-2xl font-bold">Gestión de Faltas - Calendario</h2>
                        <p className="text-muted-foreground">Selecciona un alumno para ver su calendario de asistencia.</p>
                    </header>
                    {isLoading ? <p>Cargando alumnos...</p> :
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {Array.from(semUsersMap.values()).map(user => {
                                const count = getInjustificadasCompletasCount(user.id);
                                return (
                                    <Card key={user.id} className="overflow-hidden shadow-sm flex flex-col items-center p-4 space-y-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setSelectedUser(user)}>
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src={user.fotoUrl} alt={user.username} />
                                            <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-center">
                                            <p className="font-semibold">{user.username}</p>
                                            {count > 0 && (
                                                <Badge variant="default" className="mt-1 bg-yellow-400 text-black hover:bg-yellow-500">{count}</Badge>
                                            )}
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    }
                </div>
            );
        }

        const weekDays = Array.from({ length: 5 }, (_, i) => addDays(currentWeekStart, i));

        return (
             <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
                <header className="mb-6 flex items-center justify-between">
                    <div className='flex items-center gap-4'>
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={selectedUser.fotoUrl} alt={selectedUser.username} />
                            <AvatarFallback>{getInitials(selectedUser.username)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-bold">{selectedUser.username}</h2>
                            <p className="text-muted-foreground">Gestión de asistencia de día completo.</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedUser(null)}>Volver a la lista</Button>
                </header>
                <Card>
                    <CardContent className="p-0">
                        <div className="border rounded-lg">
                            <div className="flex items-center justify-between p-4">
                                <Button variant="ghost" onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Anterior
                                </Button>
                                <Button variant="ghost" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}>
                                    Siguiente
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-5 border-t">
                                {weekDays.map(day => {
                                    const dateKey = format(day, 'yyyy-MM-dd');
                                    const dayAttendance = attendance.get(dateKey);
                                    const status = dayAttendance?.status;

                                    const isInj = status === 'falta_injustificada_completa';
                                    const isJust = status === 'falta_justificada_completa';

                                    return (
                                        <div key={dateKey} className="flex flex-col items-center text-center p-2 border-r last:border-r-0">
                                            <p className="font-bold text-blue-600 capitalize">{format(day, 'd MMMM', { locale: es })}</p>
                                            <p className="text-sm text-muted-foreground uppercase">{format(day, 'EEEE', { locale: es })}</p>
                                            <div className={cn('relative w-full mt-2 pt-8 p-4 rounded-md', {
                                                'bg-red-100 dark:bg-red-900/50': isInj,
                                                'bg-green-100 dark:bg-green-900/50': isJust
                                            })}>
                                                {renderJustificationIcon(dayAttendance?.justificacion)}
                                                <div className="flex justify-center gap-2">
                                                    <Button 
                                                        size="sm"
                                                        variant={isInj ? 'destructive' : 'outline'}
                                                        onClick={() => handleAttendanceAction(day, 'inj')}>
                                                        Inj
                                                    </Button>
                                                    <Button 
                                                        size="sm"
                                                        variant={isJust ? 'default' : 'outline'}
                                                        className={cn(isJust && 'bg-green-600 hover:bg-green-700')}
                                                        onClick={() => handleAttendanceAction(day, 'just')}>
                                                        Just
                                                    </Button>
                                                </div>
                                                {isJust && dayAttendance?.justificacion?.motivo && (
                                                    <p className="text-xs mt-2 text-green-800 dark:text-green-200 truncate">
                                                        {dayAttendance.justificacion.motivo}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };
    
    const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').toUpperCase();

    return (
        <TooltipProvider>
            <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
                <div className="flex gap-4 mb-4 border-b">
                    <Button variant={activeTab === 'resumen' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('resumen')}>Resumen de Faltas</Button>
                    <Button variant={activeTab === 'calendario' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('calendario')}>Calendario por Alumno</Button>
                </div>

                {activeTab === 'resumen' ? renderResumenView() : renderCalendarView()}
                
                <Dialog open={isJustifyDialogOpen} onOpenChange={setIsJustifyDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Justificar Falta</DialogTitle>
                            <DialogDescription>
                                Estás a punto de justificar la falta del día completo. Este paso no requiere un motivo ya que es una acción del instructor.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsJustifyDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleJustifySubmit}>Justificar Falta</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isExpedienteFormOpen} onOpenChange={setIsExpedienteFormOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Abrir Expediente Absentista</DialogTitle>
                            <DialogDescription>
                                Estás abriendo un expediente para {expedienteUser?.username}.
                            </DialogDescription>
                        </DialogHeader>
                        {expedienteUser && (
                            <AbrirExpedienteForm 
                                user={expedienteUser} 
                                onFinished={() => setIsExpedienteFormOpen(false)}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    )
}
