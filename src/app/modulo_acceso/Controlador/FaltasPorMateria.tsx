'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, serverTimestamp, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ThumbsUp, ThumbsDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import HistorialFaltasAlumno from './HistorialFaltasAlumno';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type UserDoc = {
  id: string;
  username: string;
  email: string;
  role: string[];
  fotoUrl?: string;
};

type AsistenciaStatus = 'asiste' | 'injustificada' | 'retraso' | 'falta_injustificada_completa' | 'falta_justificada_completa' | 'justificada';

type FeedbackStatus = 'positivo' | 'negativo';

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
    feedback?: FeedbackStatus;
}

const statusCycle: AsistenciaStatus[] = ['asiste', 'injustificada', 'retraso'];

const statusConfig: Record<AsistenciaStatus, { text: string; className: string }> = {
    asiste: { text: 'Asiste', className: 'bg-gray-300 hover:bg-gray-400 text-black' },
    injustificada: { text: 'Injustif.', className: 'bg-orange-500 hover:bg-orange-600 text-black' },
    retraso: { text: 'Retraso', className: 'bg-yellow-400 hover:bg-yellow-500 text-black' },
    justificada: { text: 'Justificada', className: 'bg-green-500 hover:bg-green-600 text-white' },
    falta_injustificada_completa: { text: 'Falta Día C.', className: 'bg-red-500 text-white' },
    falta_justificada_completa: { text: 'Falta Justif. C.', className: 'bg-green-500 text-white' },
};

export default function FaltasPorMateria() {
  const firestore = useFirestore();
  const { user: instructor } = useUser();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [attendanceData, setAttendanceData] = useState<Map<string, AsistenciaDoc>>(new Map());
  const [isLoadingAsistencia, setIsLoadingAsistencia] = useState(true);
  const [semUsers, setSemUsers] = useState<UserDoc[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDoc | null>(null);

  const dateKey = useMemo(() => selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '', [selectedDate]);

  useEffect(() => {
    if (!firestore) return;
    setIsLoadingUsers(true);
    const q = query(collection(firestore, 'users'), where('role', 'array-contains', 'SEM'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const users: UserDoc[] = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() } as UserDoc);
        });
        setSemUsers(users);
        setIsLoadingUsers(false);
    }, (error) => {
        console.error("Error fetching users:", error);
        setIsLoadingUsers(false);
    });

    return () => unsubscribe();
  }, [firestore]);
  
  useEffect(() => {
    if (!firestore || !dateKey) {
      setAttendanceData(new Map());
      setIsLoadingAsistencia(false);
      return;
    }
    
    setIsLoadingAsistencia(true);
    const q = query(collection(firestore, 'asistencia'), where('date', '==', dateKey));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newStatusMap = new Map<string, AsistenciaDoc>();
      snapshot.forEach(doc => {
        const data = doc.data() as AsistenciaDoc;
        newStatusMap.set(data.userId, data);
      });
      setAttendanceData(newStatusMap);
      setIsLoadingAsistencia(false);
    }, (error) => {
      console.error("Error fetching attendance: ", error);
      setIsLoadingAsistencia(false);
    });

    return () => unsubscribe();
  }, [firestore, dateKey]);


  const getStatusForUser = (userId: string): AsistenciaStatus => {
    const record = attendanceData.get(userId);
    if (!record) return 'asiste';
    return record.status;
  }
  
  const getFeedbackForUser = (userId: string): FeedbackStatus | undefined => {
    return attendanceData.get(userId)?.feedback;
  }

  const getJustificacionForUser = (userId: string): Justificacion | undefined => {
      return attendanceData.get(userId)?.justificacion;
  }

  const handleStatusChange = async (userId: string) => {
    if (!dateKey || !firestore || !instructor) {
        return;
    }
    
    const record = attendanceData.get(userId);
    const currentStatus = record?.status || 'asiste';

    if (currentStatus === 'falta_injustificada_completa' || currentStatus === 'falta_justificada_completa' || currentStatus === 'justificada') {
        return; // Don't cycle if it's a full day absence set by management or already justified
    }

    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusCycle.length;
    const nextStatus = statusCycle[nextIndex];

    const asistenciaId = `${userId}_${dateKey}`;
    const asistenciaRef = doc(firestore, 'asistencia', asistenciaId);

    try {
        const dataToSet: Partial<AsistenciaDoc> = {
            status: nextStatus,
            recordedBy: instructor.uid,
            timestamp: serverTimestamp(),
            id: asistenciaId,
            userId: userId,
            date: dateKey,
        };

        await setDoc(asistenciaRef, dataToSet, { merge: true });

        // Check if the document can be deleted.
        const updatedDoc = await getDoc(asistenciaRef);
        if (updatedDoc.exists()) {
            const data = updatedDoc.data();
            // A record is 'empty' if status is 'asiste' and it has no other relevant info.
            const isEmpty = data.status === 'asiste' && !data.feedback && !data.justificacion;
            if (isEmpty) {
                await deleteDoc(asistenciaRef);
            }
        }
    } catch (error: any) {
        console.error("Error al guardar la asistencia:", error);
    }
  };

  const handleFeedbackChange = async (userId: string, feedback: FeedbackStatus) => {
    if (!dateKey || !firestore || !instructor) return;

    const asistenciaId = `${userId}_${dateKey}`;
    const asistenciaRef = doc(firestore, 'asistencia', asistenciaId);
    const currentFeedback = getFeedbackForUser(userId);

    const newFeedback = currentFeedback === feedback ? undefined : feedback;

    try {
        const docSnap = await getDoc(asistenciaRef);
        
        let dataToSet: any = {
            feedback: newFeedback,
        };
        
        if (docSnap.exists()) {
            await updateDoc(asistenciaRef, dataToSet);
        } else {
            dataToSet = {
                ...dataToSet,
                id: asistenciaId,
                userId: userId,
                date: dateKey,
                status: getStatusForUser(userId) || 'asiste',
                recordedBy: instructor.uid,
                timestamp: serverTimestamp()
            };
            await setDoc(asistenciaRef, dataToSet, { merge: true });
        }

        const updatedDoc = await getDoc(asistenciaRef);
        if (updatedDoc.exists()) {
            const data = updatedDoc.data();
            if(data.status === 'asiste' && data.feedback === undefined && !data.justificacion) {
                await deleteDoc(asistenciaRef);
            }
        }

    } catch (error) {
        console.error("Error updating feedback:", error);
    }
  };
  
  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isLoading = isLoadingUsers || isLoadingAsistencia;

  const renderAttendanceIcon = (justificacion?: Justificacion) => {
        let icon = null;
        let tooltipText = '';

        if (justificacion) {
             icon = 'https://i.ibb.co/xS30qyTg/2-1.png';
             tooltipText = `Justificado: ${justificacion.motivo}`;
        }
        
        if (!icon) return null;

        return (
             <Tooltip>
                <TooltipTrigger asChild>
                    <div className="absolute -top-3 -right-3">
                        <Image 
                            src={icon}
                            alt="Estado de asistencia"
                            width={40}
                            height={40}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className='font-bold'>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        );
  }

  if (selectedUser) {
    return <HistorialFaltasAlumno user={selectedUser} onBack={() => setSelectedUser(null)} />;
  }


  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
        <header className="mb-6">
            <h2 className="text-2xl font-bold">Registro de Asistencia por Materia</h2>
            <p className="text-muted-foreground">Selecciona la fecha para pasar lista. Haz clic en la foto de un alumno para ver su historial.</p>
        </header>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-full sm:w-[280px] justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        locale={es}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    />
                </PopoverContent>
            </Popover>
        </div>
        
        {isLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, index) => (
                    <Card key={index} className="animate-pulse flex flex-col items-center p-4 space-y-3">
                        <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                        <div className="w-3/4 h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="w-full h-8 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                    </Card>
                ))}
             </div>
        ) : (
            <TooltipProvider>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {semUsers && semUsers.map(user => {
                    const userStatus = getStatusForUser(user.id);
                    const config = statusConfig[userStatus];
                    const justificacion = getJustificacionForUser(user.id);
                    const isFullDayAbsence = userStatus === 'falta_injustificada_completa' || userStatus === 'falta_justificada_completa';
                    const feedback = getFeedbackForUser(user.id);
                    const isFeedbackDisabled = userStatus === 'injustificada' || userStatus === 'justificada';
                    
                    return (
                        <Card key={user.id} className="overflow-hidden shadow-sm flex flex-col">
                            <CardContent className="p-4 flex-grow flex flex-col items-center text-center space-y-3">
                                <div className="relative">
                                    <Avatar className="h-16 w-16 cursor-pointer" onClick={() => setSelectedUser(user)}>
                                        <AvatarImage src={user.fotoUrl} alt={user.username} />
                                        <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                                    </Avatar>
                                    {renderAttendanceIcon(justificacion)}
                                </div>

                                <p className="font-semibold text-sm flex-1 pt-2">{user.username}</p>
                                
                                {isFullDayAbsence ? (
                                    <div className="flex items-center gap-2 w-full justify-center">
                                         <div className={cn(
                                             "flex items-center justify-center h-8 px-3 border rounded-md font-medium text-xs",
                                             userStatus === 'falta_justificada_completa' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                                         )}>
                                            {userStatus === 'falta_justificada_completa' ? 'Just' : 'Inj'}
                                        </div>
                                        <span className="text-xs text-muted-foreground font-semibold">Día completo</span>
                                    </div>
                                ) : (
                                    config && (
                                        <Button
                                            onClick={() => handleStatusChange(user.id)}
                                            className={cn("w-full text-xs px-2 h-8 transition-all", config.className)}
                                            disabled={isFullDayAbsence || userStatus === 'justificada'}
                                        >
                                            {config.text}
                                        </Button>
                                    )
                                )}

                                {!isFullDayAbsence && userStatus !== 'justificada' && (
                                    <div className={cn(
                                        "flex gap-4 pt-1",
                                        isFeedbackDisabled && "opacity-40 pointer-events-none"
                                    )}>
                                        <ThumbsUp 
                                            onClick={() => !isFeedbackDisabled && handleFeedbackChange(user.id, 'positivo')}
                                            className={cn(
                                                "h-5 w-5 text-black cursor-pointer hover:text-gray-700 transition-colors",
                                                feedback === 'positivo' && 'text-green-600',
                                                !isFeedbackDisabled && "cursor-pointer"
                                            )} 
                                        />
                                        <ThumbsDown 
                                            onClick={() => !isFeedbackDisabled && handleFeedbackChange(user.id, 'negativo')}
                                            className={cn(
                                                "h-5 w-5 text-black cursor-pointer hover:text-gray-700 transition-colors",
                                                feedback === 'negativo' && 'text-red-600',
                                                !isFeedbackDisabled && "cursor-pointer"
                                            )} 
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
            </TooltipProvider>
        )}

        {!isLoading && (!semUsers || semUsers.length === 0) && (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No hay alumnos con el rol SEM para mostrar.</p>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
