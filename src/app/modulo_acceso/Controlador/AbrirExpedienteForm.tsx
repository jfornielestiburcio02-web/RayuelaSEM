'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
    motivo: z.string().min(5, 'El motivo debe tener al menos 5 caracteres.'),
    numeroFaltas: z.coerce.number().min(1, 'El número de faltas debe ser al menos 1.'),
});

type ExpedienteFormValues = z.infer<typeof formSchema>;

type UserDoc = {
  id: string;
  username: string;
};

type AbrirExpedienteFormProps = {
  user: UserDoc;
  onFinished: () => void;
};

export default function AbrirExpedienteForm({ user, onFinished }: AbrirExpedienteFormProps) {
    const firestore = useFirestore();
    const { user: instructor } = useUser();
    const { toast } = useToast();

    const form = useForm<ExpedienteFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            motivo: '',
            numeroFaltas: 1,
        }
    });

    const onSubmit = async (data: ExpedienteFormValues) => {
        if (!firestore || !instructor) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar con la base de datos.' });
            return;
        }

        try {
            const expedientesCollectionRef = collection(firestore, 'expedientesAbsentistas');
            await addDoc(expedientesCollectionRef, {
                ...data,
                userId: user.id,
                userName: user.username,
                creadoPor: instructor.displayName || instructor.email,
                creadoEn: serverTimestamp(),
            });

            toast({
                title: 'Expediente Abierto',
                description: `Se ha abierto un expediente para ${user.username}.`,
            });
            form.reset();
            onFinished();

        } catch (error) {
            console.error("Error al abrir expediente:", error);
            toast({
                variant: 'destructive',
                title: 'Error al abrir expediente',
                description: 'Ocurrió un error al intentar guardar el expediente.',
            });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                <FormField
                    control={form.control}
                    name="motivo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Motivo del expediente</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describe el motivo para abrir este expediente..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="numeroFaltas"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nº de faltas acumuladas</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className='flex justify-end gap-2'>
                    <Button type="button" variant="outline" onClick={onFinished}>Cancelar</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Expediente'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
