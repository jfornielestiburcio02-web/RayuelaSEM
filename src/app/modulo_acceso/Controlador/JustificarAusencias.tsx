'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

const formSchema = z.object({
    dateRange: z.object({
        from: z.date({ required_error: 'La fecha de inicio es obligatoria.' }),
        to: z.date().optional(),
    }),
    motivo: z.string().min(1, 'Debes seleccionar un motivo.'),
    descripcion: z.string().optional(),
}).refine(data => {
    if (data.motivo === 'Otros') {
        return data.descripcion && data.descripcion.length > 0;
    }
    return true;
}, {
    message: 'La descripción es obligatoria si el motivo es "Otros".',
    path: ['descripcion'],
});

type JustificacionForm = z.infer<typeof formSchema>;

export default function JustificarAusencias() {
    const firestore = useFirestore();
    const { user: semUser } = useUser();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<JustificacionForm>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            motivo: '',
            descripcion: '',
        }
    });

    const motivoSeleccionado = watch('motivo');

    const onSubmit = async (data: JustificacionForm) => {
        if (!semUser || !firestore || !data.dateRange.from) return;

        setIsSubmitting(true);

        const startDate = data.dateRange.from;
        const endDate = data.dateRange.to || startDate;
        const datesToJustify = eachDayOfInterval({ start: startDate, end: endDate });

        try {
            const batch = writeBatch(firestore);

            for (const date of datesToJustify) {
                const dateKey = format(date, 'yyyy-MM-dd');
                const asistenciaId = `${semUser.uid}_${dateKey}`;
                const asistenciaRef = doc(firestore, 'asistencia', asistenciaId);

                // This object only contains the justification data
                const justificacionData = {
                    justificacion: {
                        motivo: data.motivo,
                        descripcion: data.descripcion || '',
                    },
                    userId: semUser.uid,
                    date: dateKey,
                    timestamp: serverTimestamp(), 
                };
                
                // Use set with merge to create or update the document.
                // This ensures that if a record already exists, we add/overwrite
                // the justification, without deleting other fields (like feedback or status).
                batch.set(asistenciaRef, justificacionData, { merge: true });
            }
            
            await batch.commit();

            toast({
                title: 'Ausencias Justificadas',
                description: `Se ha registrado la justificación para el rango de fechas seleccionado. El instructor revisará tu petición.`,
            });
            reset();

        } catch (error) {
            console.error("Error al justificar ausencias:", error);
            toast({
                variant: 'destructive',
                title: 'Error al justificar',
                description: 'Ocurrió un error al intentar guardar la justificación.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
            <Card>
                <CardHeader>
                    <CardTitle>Justificar Ausencias</CardTitle>
                    <CardDescription>
                        Selecciona el rango de fechas y el motivo de la ausencia. La justificación se enviará al instructor para su revisión.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                           <div className='space-y-2'>
                                <Label htmlFor="date-range-calendar">Fechas de la ausencia</Label>
                                <Controller
                                    name="dateRange"
                                    control={control}
                                    render={({ field }) => (
                                        <Calendar
                                            id="date-range-calendar"
                                            mode="range"
                                            selected={field.value as DateRange}
                                            onSelect={field.onChange}
                                            locale={es}
                                            className="rounded-md border p-0 inline-block"
                                            disabled={(date) => date > new Date()}
                                        />
                                    )}
                                />
                                {errors.dateRange?.from && <p className="text-sm font-medium text-destructive">{errors.dateRange.from.message}</p>}
                           </div>

                            <div className='space-y-6'>
                                <Controller
                                    name="motivo"
                                    control={control}
                                    render={({ field }) => (
                                        <div className='space-y-2'>
                                            <Label htmlFor="motivo-select">Motivo</Label>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger id="motivo-select">
                                                    <SelectValue placeholder="Selecciona un motivo..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Enfermedad">Enfermedad</SelectItem>
                                                    <SelectItem value="Visita al médico">Visita al médico</SelectItem>
                                                    <SelectItem value="Problema familiar">Problema familiar</SelectItem>
                                                    <SelectItem value="Otros">Otros</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.motivo && <p className="text-sm font-medium text-destructive">{errors.motivo.message}</p>}
                                        </div>
                                    )}
                                />
                                <div className='space-y-2'>
                                     <Label htmlFor="descripcion">Descripción (opcional)</Label>
                                     <Textarea 
                                        id="descripcion"
                                        {...register('descripcion')}
                                        placeholder={motivoSeleccionado === 'Otros' ? 'Explica brevemente el motivo...' : 'Añade más detalles si lo deseas...'}
                                     />
                                     {errors.descripcion && <p className="text-sm font-medium text-destructive">{errors.descripcion.message}</p>}
                                </div>
                            </div>
                        </div>

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Justificando...' : 'Aceptar y Justificar'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
