'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Play, Square } from 'lucide-react';

type ServicioDoc = {
    id: string;
    semUserId: string;
    semUserName: string;
    startTime: Timestamp;
    endTime?: Timestamp;
};

export default function ServicioSEM() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [isLoading, setIsLoading] = useState(true);

    const updateElapsedTime = useCallback(() => {
        if (!startTime) return;
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        setElapsedTime(`${hours}:${minutes}:${seconds}`);
    }, [startTime]);

    useEffect(() => {
        if (!firestore || !user) return;
        setIsLoading(true);

        const serviciosRef = collection(firestore, 'servicios');
        const q = query(serviciosRef, where('semUserId', '==', user.uid), where('endTime', '==', null));

        getDocs(q).then((snapshot) => {
            if (!snapshot.empty) {
                const activeServiceDoc = snapshot.docs[0];
                const data = activeServiceDoc.data() as ServicioDoc;
                setActiveServiceId(activeServiceDoc.id);
                setStartTime(data.startTime.toDate());
            }
        }).finally(() => setIsLoading(false));
    }, [firestore, user]);

    useEffect(() => {
        if (startTime) {
            const timerId = setInterval(updateElapsedTime, 1000);
            return () => clearInterval(timerId);
        }
    }, [startTime, updateElapsedTime]);

    const handleStartService = async () => {
        if (!firestore || !user) return;
        setIsLoading(true);
        try {
            const newServiceRef = doc(collection(firestore, 'servicios'));
            const now = new Date();
            const newService: Omit<ServicioDoc, 'id'> = {
                semUserId: user.uid,
                semUserName: user.displayName || 'Usuario SEM',
                startTime: Timestamp.fromDate(now),
            };
            await setDoc(newServiceRef, newService);
            setActiveServiceId(newServiceRef.id);
            setStartTime(now);
            toast({ title: 'Servicio iniciado', description: 'El temporizador ha comenzado.' });
        } catch (error) {
            console.error("Error al iniciar el servicio:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo iniciar el servicio.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStopService = async () => {
        if (!firestore || !activeServiceId) return;
        setIsLoading(true);
        try {
            const serviceDocRef = doc(firestore, 'servicios', activeServiceId);
            await updateDoc(serviceDocRef, {
                endTime: serverTimestamp(),
            });
            setActiveServiceId(null);
            setStartTime(null);
            setElapsedTime('00:00:00');
            toast({ title: 'Servicio finalizado', description: 'El tiempo de servicio ha sido registrado.' });
        } catch (error) {
            console.error("Error al finalizar el servicio:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo finalizar el servicio.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Control de Servicio</CardTitle>
                    <CardDescription>Registra el inicio y fin de tu turno de servicio.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-8 p-10">
                    <div className="text-6xl font-mono font-bold text-center bg-gray-900 text-green-400 p-4 rounded-lg w-full">
                        {elapsedTime}
                    </div>

                    <div className="flex w-full gap-4">
                        <Button
                            onClick={handleStartService}
                            disabled={isLoading || !!activeServiceId}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            size="lg"
                        >
                            <Play className="mr-2" />
                            Ingreso en Servicio
                        </Button>
                        <Button
                            onClick={handleStopService}
                            disabled={isLoading || !activeServiceId}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            size="lg"
                        >
                            <Square className="mr-2" />
                            Salir de Servicio
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
