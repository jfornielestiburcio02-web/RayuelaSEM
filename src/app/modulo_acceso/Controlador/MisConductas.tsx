'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

export default function MisConductas() {
    const firestore = useFirestore();
    const { user } = useUser();
    
    const conductasQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'conductas'),
            where('alumnoId', '==', user.uid),
            orderBy('fecha', 'desc')
        );
    }, [firestore, user]);

    const { data: conductas, isLoading } = useCollection<ConductaDoc>(conductasQuery);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Fecha no especificada';
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        return format(date, 'PPP', { locale: es });
    };
    
    const formatDateTimestamp = (timestamp?: Timestamp) => {
        return timestamp ? format(timestamp.toDate(), 'PPP p', { locale: es }) : '';
    };

    return (
        <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-2xl font-bold mb-6">Mis Registros de Conducta</h2>
            
            {isLoading && <p className='text-center text-muted-foreground'>Cargando registros...</p>}
            
            {!isLoading && (!conductas || conductas.length === 0) && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">No tienes registros de conducta.</p>
                    </CardContent>
                </Card>
            )}

            {!isLoading && conductas && conductas.length > 0 && (
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {conductas.map((conducta) => (
                        <AccordionItem value={conducta.id} key={conducta.id}>
                             <Card className='overflow-hidden'>
                                <AccordionTrigger className="p-6 text-left hover:no-underline">
                                    <div className='flex-1 grid grid-cols-1 md:grid-cols-3 items-center gap-4'>
                                        <div>
                                            <p className="font-bold text-base">{conducta.incidente}</p>
                                            <p className="text-sm text-muted-foreground">{formatDate(conducta.fecha)}</p>
                                        </div>
                                        <div>
                                             <p className="text-sm">Comunicado por: <span className='font-medium'>{conducta.instructorName}</span></p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                               Tipo: <span className='font-semibold'>{conducta.tipoMedida}</span>
                                            </p>
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
        </div>
    );
}
