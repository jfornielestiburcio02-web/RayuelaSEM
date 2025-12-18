'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type ExpedienteDoc = {
    id: string;
    userId: string;
    userName: string;
    motivo: string;
    numeroFaltas: number;
    creadoPor: string; // Should be a user's name, not ID
    creadoEn: Timestamp;
};

export default function PersonalAbsentista() {
  const firestore = useFirestore();
  
  const expedientesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'expedientesAbsentistas'), orderBy('creadoEn', 'desc'));
  }, [firestore]);
  
  const { data: expedientes, isLoading } = useCollection<ExpedienteDoc>(expedientesQuery);

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return 'Fecha desconocida';
    return format(timestamp.toDate(), 'PPP p', { locale: es });
  };

  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
        <h2 className="text-2xl font-bold mb-6">Personal Absentista</h2>
        {isLoading && <p className='text-center text-muted-foreground'>Cargando expedientes...</p>}
        {!isLoading && (!expedientes || expedientes.length === 0) && (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No hay expedientes de absentismo abiertos.</p>
                </CardContent>
            </Card>
        )}
        {!isLoading && expedientes && expedientes.length > 0 && (
            <Accordion type="single" collapsible className="w-full space-y-4">
                {expedientes.map((expediente) => (
                    <AccordionItem value={expediente.id} key={expediente.id}>
                         <Card className='overflow-hidden'>
                            <AccordionTrigger className="p-6 text-left hover:no-underline">
                                <div className='flex-1 grid grid-cols-3 items-center'>
                                    <div>
                                        <p className="font-bold text-base">{expediente.userName}</p>
                                        <p className="text-sm text-muted-foreground">Expediente</p>
                                    </div>
                                    <div>
                                         <p className="text-sm text-muted-foreground">{formatDate(expediente.creadoEn)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                           <span className='font-semibold'>{expediente.numeroFaltas}</span> faltas registradas
                                        </p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <CardContent className='pt-0'>
                                    <div className='prose prose-sm dark:prose-invert max-w-none'>
                                        <h4 className='font-semibold'>Motivo del expediente:</h4>
                                        <p>{expediente.motivo}</p>
                                        <p className='text-xs text-muted-foreground mt-4'>Expediente creado por {expediente.creadoPor}.</p>
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
