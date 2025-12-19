'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
    startDate: z.date({ required_error: 'La fecha de inicio es obligatoria.' }),
    endDate: z.date({ required_error: 'La fecha de fin es obligatoria.' }),
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
}).refine(data => data.endDate >= data.startDate, {
    message: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
    path: ['endDate'],
});


type JustificacionForm = z.infer<typeof formSchema>;

export default function JustificarAusencias() {
    const firestore = useFirestore();
    const { user: semUser } = useUser();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<JustificacionForm>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            motivo: '',
            descripcion: '',
        }
    });

    const motivoSeleccionado = form.watch('motivo');

    const onSubmit = async (data: JustificacionForm) => {
        if (!semUser || !firestore || !data.startDate || !data.endDate) return;

        setIsSubmitting(true);

        const startDate = data.startDate;
        const endDate = data.endDate;
        const datesToJustify = eachDayOfInterval({ start: startDate, end: endDate });

        try {
            const batch = writeBatch(firestore);

            for (const date of datesToJustify) {
                const dateKey = format(date, 'yyyy-MM-dd');
                const asistenciaId = `${semUser.uid}_${dateKey}`;
                const asistenciaRef = doc(firestore, 'asistencia', asistenciaId);

                const justificacionData = {
                    justificacion: {
                        motivo: data.motivo,
                        descripcion: data.descripcion || '',
                    },
                    userId: semUser.uid,
                    date: dateKey,
                    timestamp: serverTimestamp(), 
                };
                
                batch.set(asistenciaRef, justificacionData, { merge: true });
            }
            
            await batch.commit();

            toast({
                title: 'Ausencias Justificadas',
                description: `Se ha registrado la justificación para el rango de fechas seleccionado. El instructor revisará tu petición.`,
            });
            form.reset();

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
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className='space-y-2'>
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Día de inicio</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date < new Date("1900-01-01")}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Día de fin</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date < new Date("1900-01-01")}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className='space-y-6'>
                                     <FormField
                                        control={form.control}
                                        name="motivo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Motivo</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona un motivo..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Enfermedad">Enfermedad</SelectItem>
                                                        <SelectItem value="Visita al médico">Visita al médico</SelectItem>
                                                        <SelectItem value="Problema familiar">Problema familiar</SelectItem>
                                                        <SelectItem value="Otros">Otros</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="descripcion"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Descripción (opcional)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder={motivoSeleccionado === 'Otros' ? 'Explica brevemente el motivo...' : 'Añade más detalles si lo deseas...'}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Justificando...' : 'Aceptar y Justificar'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}