'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteField, onSnapshot, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
import { serverTimestamp } from 'firebase/firestore';

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
    status?: AsistenciaStatus;
    recordedBy: string;
    timestamp?: any;
    justificacion?: Justificacion;
    feedback?: FeedbackStatus;
}

const statusCycle: AsistenciaStatus[] = ['injustificada', 'retraso']; // 'asiste' is handled by deletion

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


  const getStatusForUser = (userId: string): AsistenciaStatus | undefined => {
    return attendanceData.get(userId)?.status;
  }
  
  const getFeedbackForUser = (userId: string): FeedbackStatus | undefined => {
    return attendanceData.get(userId)?.feedback;
  }

  const getJustificacionForUser = (userId: string): Justificacion | undefined => {
      return attendanceData.get(userId)?.justificacion;
  }

  const handleStatusChange = async (userId: string) => {
    if (!dateKey || !firestore || !instructor) return;
    
    const record = attendanceData.get(userId);
    const currentStatus = record?.status;

    if (currentStatus === 'falta_injustificada_completa' || currentStatus === 'falta_justificada_completa' || currentStatus === 'justificada') {
        return; // Don't cycle if it's a full day absence set by management or already justified
    }

    const asistenciaId = `${userId}_${dateKey}`;
    const asistenciaRef = doc(firestore, 'asistencia', asistenciaId);

    const currentIndex = currentStatus ? statusCycle.indexOf(currentStatus) : -1;
    
    // If we've cycled through all states, it means we go back to 'asiste' which means deleting the record or status field.
    if (currentIndex === statusCycle.length - 1) {
         if (record?.justificacion || record?.feedback) {
            await updateDoc(asistenciaRef, { status: deleteField() });
        } else {
            await deleteDoc(asistenciaRef);
        }
    } else {
        const nextStatus = statusCycle[currentIndex + 1];
        const dataToSet: Partial<AsistenciaDoc> = {
            status: nextStatus,
            recordedBy: instructor.uid,
            timestamp: serverTimestamp(),
        };
        // Use set with merge to create the document if it doesn't exist.
        await setDoc(asistenciaRef, dataToSet, { merge: true });
    }
  };

  const handleFeedbackChange = async (userId: string, feedback: FeedbackStatus) => {
    if (!dateKey || !firestore || !instructor) return;

    const asistenciaId = `${userId}_${dateKey}`;
    const asistenciaRef = doc(firestore, 'asistencia', asistenciaId);
    const record = attendanceData.get(userId);
    const currentFeedback = record?.feedback;

    const newFeedback = currentFeedback === feedback ? undefined : feedback;

    try {
        const docSnap = await getDoc(asistenciaRef);
        
        let dataToSet: any = {
            feedback: newFeedback,
        };
        
        if (docSnap.exists()) {
            await updateDoc(asistenciaRef, { feedback: newFeedback ? newFeedback : deleteField() });
        } else {
             if (!newFeedback) return; // No need to create a doc just to remove feedback
            dataToSet = {
                ...dataToSet,
                recordedBy: instructor.uid,
                timestamp: serverTimestamp()
            };
            await setDoc(asistenciaRef, dataToSet, { merge: true });
        }

        const updatedDoc = await getDoc(asistenciaRef);
        if (updatedDoc.exists()) {
            const data = updatedDoc.data();
            // If the document has no status, no feedback, and no justification, it's empty and can be deleted.
            if(!data.status && !data.feedback && !data.justificacion) {
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
                    const config = userStatus ? statusConfig[userStatus] : statusConfig['asiste'];
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
                                     <div className="flex items-center justify-center gap-2 h-8 w-full">
                                         <div className="bg-gray-200 text-gray-800 px-2 py-1 rounded-md">
                                             <span className="font-bold text-xs text-black">
                                                 {userStatus === 'falta_injustificada_completa' ? 'Inj' : 'Just'}
                                             </span>
                                         </div>
                                         <span className="text-xs font-medium text-muted-foreground">Día Completo</span>
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
