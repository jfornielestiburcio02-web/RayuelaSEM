'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type ConductaDoc = {
    id: string;
    incidente: string;
    descripcion: string;
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

type DialogoHistorialConductaProps = {
    userId: string;
};

export default function DialogoHistorialConducta({ userId }: DialogoHistorialConductaProps) {
    const firestore = useFirestore();
    
    const conductasQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'conductas'),
            where('alumnoId', '==', userId),
            orderBy('fecha', 'desc')
        );
    }, [firestore, userId]);

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

    const isLoading = isLoadingConductas;

    return (
        <div className="max-h-[60vh] overflow-y-auto pr-4 py-4">
            {isLoading && <p className='text-center text-muted-foreground'>Cargando registros...</p>}
            
            {!isLoading && (!conductas || conductas.length === 0) && (
                <div className="text-center text-muted-foreground py-8">
                    <p>Este alumno no tiene registros de conducta.</p>
                </div>
            )}

            {!isLoading && conductas && conductas.length > 0 && (
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {conductas.map((conducta) => (
                        <AccordionItem value={conducta.id} key={conducta.id} className="border-b-0">
                             <Card className='overflow-hidden'>
                                <AccordionTrigger className="p-4 text-left hover:no-underline [&[data-state=open]]:border-b">
                                    <div className='flex-1 grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-sm'>
                                        <div>
                                            <p className="font-bold">{conducta.incidente}</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(conducta.fecha)}</p>
                                        </div>
                                        <div>
                                             <p className="text-xs">Por: <span className='font-medium'>{conducta.instructorName}</span></p>
                                        </div>
                                        <div className='flex justify-end'>
                                            <Badge variant={conducta.tipoMedida === 'Graves' ? 'destructive' : 'secondary'}>{conducta.tipoMedida}</Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className='pt-4 pb-6 px-6'>
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
                                            
                                            {conducta.aplicaCorreccion && conducta.tipoCorreccion &&(
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
