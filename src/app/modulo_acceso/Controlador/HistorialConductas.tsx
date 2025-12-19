'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ConductaDoc = {
    id: string;
    alumnoId: string;
    alumnoName: string;
    incidente: string;
    descripcion: string;
    instructorId: string;
    instructorName: string;
    fecha: string; // YYYY-MM-DD
    tipoMedida: "Contrarias" | "Graves";
    medidas?: string[];
    medidaOtro?: string;
    aplicaCorreccion: boolean;
    tipoCorreccion?: "Amonestacion oral" | "Apercibimiento por escrito" | "Suspender el derecho de asisstir de 1 a 3 días" | "Otros";
    correccionOtro?: string;
    creadoEn: Timestamp;
};

type UserDoc = {
    id: string;
    username: string;
}

export default function HistorialConductas() {
    const firestore = useFirestore();
    const [selectedUserId, setSelectedUserId] = useState<string>('todos');

    const usersQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'users'), where('role', 'array-contains', 'SEM')) : null,
      [firestore]
    );
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserDoc>(usersQuery);
    
    const conductasQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        let q = query(collection(firestore, 'conductas'), orderBy('fecha', 'desc'));
        if (selectedUserId !== 'todos') {
            q = query(q, where('alumnoId', '==', selectedUserId));
        }
        return q;
    }, [firestore, selectedUserId]);

    const { data: conductas, isLoading: isLoadingConductas } = useCollection<ConductaDoc>(conductasQuery);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Fecha no especificada';
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        return format(date, 'PPP', { locale: es });
    };
    
    const formatDateTimestamp = (timestamp?: Timestamp) => {
        return timestamp ? format(timestamp.toDate(), 'PPP p', { locale: es }) : '';
    };

    const isLoading = isLoadingUsers || isLoadingConductas;

    return (
        <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
            <Card>
                <CardHeader>
                    <CardTitle>Registro Histórico de Conductas</CardTitle>
                    <CardDescription>Consulta todos los registros de conducta de los alumnos.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center gap-4 mb-6">
                        <label htmlFor="user-select" className="font-medium shrink-0">Filtrar por Alumno:</label>
                        <Select onValueChange={setSelectedUserId} value={selectedUserId} disabled={isLoadingUsers}>
                            <SelectTrigger id="user-select" className="w-full max-w-sm">
                                <SelectValue placeholder="Todos los alumnos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los alumnos</SelectItem>
                                {users?.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading && <p className='text-center text-muted-foreground'>Cargando registros...</p>}
                    
                    {!isLoading && (!conductas || conductas.length === 0) && (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No se encontraron registros para la selección actual.</p>
                        </div>
                    )}

                    {!isLoading && conductas && conductas.length > 0 && (
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {conductas.map((conducta) => (
                                <AccordionItem value={conducta.id} key={conducta.id}>
                                     <Card className='overflow-hidden'>
                                        <AccordionTrigger className="p-6 text-left hover:no-underline">
                                            <div className='flex-1 grid grid-cols-1 md:grid-cols-4 items-center gap-4'>
                                                <div>
                                                    <p className="font-bold text-base">{conducta.alumnoName}</p>
                                                    <p className="text-sm text-muted-foreground">{conducta.incidente}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{formatDate(conducta.fecha)}</p>
                                                </div>
                                                <div>
                                                     <p className="text-sm">Por: <span className='font-medium'>{conducta.instructorName}</span></p>
                                                </div>
                                                <div className='flex justify-end'>
                                                    <Badge variant={conducta.tipoMedida === 'Graves' ? 'destructive' : 'secondary'}>{conducta.tipoMedida}</Badge>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <CardContent className='pt-0 pb-6 px-6'>
                                                <div className='prose prose-sm dark:prose-invert max-w-none space-y-4'>
                                                    <div>
                                                        <h4 className='font-semibold'>Descripción del Incidente:</h4>
                                                        <p>{conducta.descripcion}</p>
                                                    </div>
                                                    
                                                    {conducta.medidas && conducta.medidas.length > 0 && (
                                                         <div>
                                                            <h4 className='font-semibold'>Medidas Aplicadas:</h4>
                                                            <ul className='list-disc pl-5'>
                                                                {conducta.medidas.map(m => <li key={m}>{m}</li>)}
                                                                {conducta.medidaOtro && <li>{conducta.medidaOtro}</li>}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    
                                                    {conducta.aplicaCorreccion && (
                                                        <div>
                                                            <h4 className='font-semibold'>Corrección Aplicada:</h4>
                                                            <p>{conducta.tipoCorreccion}</p>
                                                            {conducta.tipoCorreccion === 'Otros' && conducta.correccionOtro && (
                                                                 <p><strong>Detalle:</strong> {conducta.correccionOtro}</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    <p className='text-xs text-muted-foreground pt-4 border-t'>Registrado el: {formatDateTimestamp(conducta.creadoEn)}</p>
                                                </div>
                                            </CardContent>
                                        </AccordionContent>
                                    </Card>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
