'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
    nombrePaciente: z.string().min(1, 'El nombre del paciente es obligatorio.'),
    edadEstimada: z.coerce.number().min(0, 'La edad no puede ser negativa.'),
    procedimientos: z.string().min(1, 'Los procedimientos son obligatorios.'),
    estado: z.string().min(1, 'El estado es obligatorio.'),
    descripcion: z.string().min(1, 'La descripción es obligatoria.'),
    dni: z.string().optional(),
});

type InformeFormValues = z.infer<typeof formSchema>;

export default function CrearInformeForm() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const form = useForm<InformeFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombrePaciente: '',
            edadEstimada: 0,
            procedimientos: '',
            estado: '',
            descripcion: '',
            dni: '',
        }
    });

    const onSubmit = async (data: InformeFormValues) => {
        if (!firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se ha podido conectar con la base de datos.',
            });
            return;
        }

        try {
            const informesCollectionRef = collection(firestore, 'informes');
            await addDoc(informesCollectionRef, {
                ...data,
                creadoPor: user?.uid || 'anonimo',
                creadoEn: serverTimestamp(),
            });

            toast({
                title: 'Informe Guardado',
                description: 'El informe del paciente ha sido guardado correctamente.',
            });
            form.reset();

        } catch (error) {
            console.error("Error al guardar el informe:", error);
            toast({
                variant: 'destructive',
                title: 'Error al guardar',
                description: 'Ocurrió un error al intentar guardar el informe.',
            });
        }
    };

    return (
        <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Crear Nuevo Informe</CardTitle>
                    <CardDescription>
                        Rellena los siguientes campos para registrar un nuevo informe de paciente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="nombrePaciente"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del paciente</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="edadEstimada"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Edad estimada</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="45" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="procedimientos"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Procedimientos</FormLabel>
                                            <FormControl>
                                                <Input placeholder="RCP, vendaje, etc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="estado"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Estable, crítico, etc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                               <FormField
                                    control={form.control}
                                    name="dni"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>DNI (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="12345678A" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                               <FormField
                                    control={form.control}
                                    name="descripcion"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Descripción</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe el estado del paciente, el incidente y las acciones tomadas..."
                                                    className="min-h-[120px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Informe'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
