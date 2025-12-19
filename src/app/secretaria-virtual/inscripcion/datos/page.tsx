'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  apellidos: z.string().min(1, "Los apellidos son obligatorios."),
  dni: z.string().min(1, "El DNI es obligatorio."),
  fechaNacimiento: z.date({ required_error: "La fecha de nacimiento es obligatoria." }),
  usuarioDiscord: z.string().min(1, "El usuario de Discord es obligatorio."),
  fotoUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  sexo: z.enum(["Hombre", "Mujer", "Otro"], { required_error: "Debes seleccionar un sexo." }),
  nacionalidad: z.string().min(1, "La nacionalidad es obligatoria."),
  quiereAccederSem: z.enum(["si", "no"], { required_error: "¿Quieres acceder al SEM?" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function DatosPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: "",
            apellidos: "",
            dni: "",
            usuarioDiscord: "",
            fotoUrl: "",
            nacionalidad: "",
        },
    });

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar a la base de datos.' });
            setIsSubmitting(false);
            return;
        }

        try {
            const solicitudData = {
                ...values,
                fechaNacimiento: format(values.fechaNacimiento, 'yyyy-MM-dd'),
                quiereAccederSem: values.quiereAccederSem === 'si',
                creadoEn: serverTimestamp(),
                status: 'pendiente',
            };
            await addDoc(collection(firestore, 'solicitudesAcceso'), solicitudData);
            setIsSuccess(true);
        } catch (error) {
            console.error("Error al enviar solicitud:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la solicitud.' });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (isSuccess) {
        return (
             <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
                <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <div className='flex justify-center mb-4'>
                            <CheckCircle2 className='w-16 h-16 text-green-500' />
                        </div>
                        <CardTitle>¡Solicitud Enviada!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className='text-muted-foreground'>Gracias, contactaremos lo antes posible a su MD en discord. Gracias.</p>
                    </CardContent>
                </Card>
             </main>
        )
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-4 bg-white pt-12 pb-12">
            <Card className="w-full max-w-3xl">
                <CardHeader>
                    <CardTitle>Formulario de Inscripción</CardTitle>
                    <CardDescription>Rellena tus datos para solicitar el acceso.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="nombre" render={({ field }) => (
                                    <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="apellidos" render={({ field }) => (
                                    <FormItem><FormLabel>Apellidos</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="dni" render={({ field }) => (
                                    <FormItem><FormLabel>DNI</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="fechaNacimiento" render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Fecha de Nacimiento</FormLabel><Popover>
                                        <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? (format(field.value, "PPP", { locale: es })) : (<span>Selecciona una fecha</span>)}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button></FormControl></PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange}
                                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                                        </PopoverContent>
                                    </Popover><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="usuarioDiscord" render={({ field }) => (
                                    <FormItem><FormLabel>Usuario (Discord)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="fotoUrl" render={({ field }) => (
                                    <FormItem><FormLabel>Imagen de perfil (Opcional)</FormLabel><FormControl><Input placeholder="https://ejemplo.com/imagen.png" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="sexo" render={({ field }) => (
                                    <FormItem><FormLabel>Sexo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="Hombre">Hombre</SelectItem><SelectItem value="Mujer">Mujer</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent>
                                    </Select><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="nacionalidad" render={({ field }) => (
                                    <FormItem><FormLabel>Nacionalidad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                             </div>
                             <FormField control={form.control} name="quiereAccederSem" render={({ field }) => (
                                <FormItem className="space-y-3"><FormLabel>¿Quiere acceder al SEM?</FormLabel><FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="si" /></FormControl><FormLabel className="font-normal">Sí</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                                    </RadioGroup>
                                </FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Enviando...' : 'Aceptar'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </main>
    );
}
