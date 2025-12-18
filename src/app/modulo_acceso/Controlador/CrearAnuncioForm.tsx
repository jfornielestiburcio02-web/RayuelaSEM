'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, doc } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UserRole = "SEM" | "Instructor" | "Dirección";

const formSchema = z.object({
    descripcion: z.string().min(1, 'La descripción es obligatoria.'),
    detalle: z.string().min(1, 'El detalle es obligatorio.'),
    tipoDestinatario: z.enum(['todos', 'individual'], { required_error: 'Debes seleccionar un tipo de destinatario.' }),
    destinatarios: z.array(z.string()).optional(),
    grupoDestinatario: z.string().optional(),
}).refine(data => {
    if (data.tipoDestinatario === 'individual') {
        return data.destinatarios && data.destinatarios.length > 0;
    }
    return true;
}, {
    message: 'Debes seleccionar al menos un destinatario.',
    path: ['destinatarios'],
});

type AnuncioFormValues = z.infer<typeof formSchema>;

type UserDoc = {
  id: string;
  username: string;
  role?: string[];
};

const getRecipientGroups = (roles: string[]): UserRole[] => {
    if (roles.includes('Dirección')) {
        return ['SEM', 'Instructor'];
    }
    if (roles.includes('Facciones Legales')) {
        return ['SEM', 'Instructor', 'Dirección'];
    }
    if (roles.includes('Instructor')) {
        return ['SEM', 'Dirección', 'Instructor'];
    }
    if (roles.includes('SEM')) {
        return ['Instructor'];
    }
    return [];
};


export default function CrearAnuncioForm() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(
      () => (currentUser ? doc(firestore, 'users', currentUser.uid) : null),
      [currentUser, firestore]
    );
    const { data: userData } = useDoc<UserDoc>(userDocRef);
    const userRoles = userData?.role || [];
    
    const recipientGroups = getRecipientGroups(userRoles);
    
    const [selectedRecipientGroup, setSelectedRecipientGroup] = useState<UserRole | undefined>(recipientGroups[0]);

    const recipientsQuery = useMemoFirebase(
      () => {
        if (!firestore || !selectedRecipientGroup) return null;
        
        let targetRole: UserRole | "Instructor Gestion" = selectedRecipientGroup;

        // Special case for instructors messaging other instructors
        if (userRoles.includes('Instructor') && selectedRecipientGroup === 'Instructor') {
             // This query will fetch all instructors including the current user. 
             // We can filter the current user out on the client side.
            return query(collection(firestore, 'users'), where('role', 'array-contains', 'Instructor'));
        }

        return query(collection(firestore, 'users'), where('role', 'array-contains', targetRole));
      },
      [firestore, selectedRecipientGroup, userRoles]
    );
    const { data: recipients, isLoading: isLoadingRecipients } = useCollection<UserDoc>(recipientsQuery);
    
    const filteredRecipients = useMemo(() => {
        if (!recipients) return [];
        // Filter out the current user if they are an instructor messaging other instructors
        if (userRoles.includes('Instructor') && selectedRecipientGroup === 'Instructor') {
            return recipients.filter(r => r.id !== currentUser?.uid);
        }
        return recipients;
    }, [recipients, userRoles, selectedRecipientGroup, currentUser]);


    const form = useForm<AnuncioFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            descripcion: '',
            detalle: '',
            tipoDestinatario: 'todos',
            destinatarios: [],
            grupoDestinatario: recipientGroups[0] || '',
        }
    });
    
    const tipoDestinatario = form.watch('tipoDestinatario');
    const grupoDestinatarioForm = form.watch('grupoDestinatario');

    useEffect(() => {
        if (grupoDestinatarioForm) {
            setSelectedRecipientGroup(grupoDestinatarioForm as UserRole);
            form.setValue('destinatarios', []); // Reset individual recipients when group changes
        }
    }, [grupoDestinatarioForm, form]);

    const onSubmit = async (data: AnuncioFormValues) => {
        if (!firestore || !currentUser || !selectedRecipientGroup) return;

        let para: string[] = [];
        if (data.tipoDestinatario === 'todos') {
            // Map logical role to a broadcast tag
            const broadcastMap: Record<UserRole, string> = {
                'SEM': 'TODOS_SEM',
                'Instructor': 'TODOS_INSTRUCTORES',
                'Dirección': 'TODOS_DIRECCION',
            };
            para.push(broadcastMap[selectedRecipientGroup]);
        } else {
            para = data.destinatarios || [];
        }

        try {
            const anunciosCollectionRef = collection(firestore, 'anuncios');
            await addDoc(anunciosCollectionRef, {
                descripcion: data.descripcion,
                detalle: data.detalle,
                para: para,
                creadoPor: currentUser.uid,
                creadoEn: serverTimestamp(),
            });

            toast({
                title: 'Mensaje Enviado',
                description: 'El mensaje ha sido enviado correctamente.',
            });
            form.reset();

        } catch (error) {
            console.error("Error al enviar el mensaje:", error);
            toast({
                variant: 'destructive',
                title: 'Error al enviar',
                description: 'Ocurrió un error al intentar enviar el mensaje.',
            });
        }
    };
    
    const getRadioLabel = () => {
        if (!selectedRecipientGroup) return "Todos";
        const groupTranslations: Record<UserRole, string> = {
            'SEM': 'Todos los SEM',
            'Instructor': 'Todos los Instructores',
            'Dirección': 'Toda la Dirección',
        };
        return groupTranslations[selectedRecipientGroup];
    };

    const getCheckboxDescription = () => {
        if (!selectedRecipientGroup) return "Selecciona los destinatarios.";
        const groupTranslations: Record<UserRole, string> = {
            'SEM': 'Selecciona los usuarios SEM que recibirán el mensaje.',
            'Instructor': 'Selecciona los instructores que recibirán el mensaje.',
            'Dirección': 'Selecciona los miembros de dirección que recibirán el mensaje.',
        };
        return groupTranslations[selectedRecipientGroup];
    };


    return (
        <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Crear Nuevo Mensaje</CardTitle>
                    <CardDescription>
                        Rellena los siguientes campos para enviar un nuevo mensaje.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            
                            {recipientGroups.length > 1 && (
                                <FormField
                                    control={form.control}
                                    name="grupoDestinatario"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Grupo de Destinatarios</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un grupo..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {recipientGroups.map(group => (
                                                        <SelectItem key={group} value={group}>
                                                            {group === 'Instructor' && userRoles.includes('Instructor') ? 'Otros Instructores' : group}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>Selecciona a qué grupo de usuarios quieres enviar el mensaje.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            
                            <FormField
                                control={form.control}
                                name="descripcion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Asunto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Asunto del mensaje" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="detalle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cuerpo del Mensaje</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Escribe aquí tu mensaje..."
                                                className="min-h-[150px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tipoDestinatario"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Enviar Para:</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-1"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="todos" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">{getRadioLabel()}</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="individual" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Seleccionar Individualmente</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {tipoDestinatario === 'individual' && (
                                 <FormField
                                    control={form.control}
                                    name="destinatarios"
                                    render={() => (
                                        <FormItem>
                                            <div className="mb-4">
                                                <FormLabel className="text-base">Destinatarios</FormLabel>
                                                <FormDescription>
                                                   {getCheckboxDescription()}
                                                </FormDescription>
                                            </div>
                                            <ScrollArea className="h-40 w-full rounded-md border p-4">
                                                {isLoadingRecipients ? <p>Cargando usuarios...</p> : (
                                                    filteredRecipients?.map((user) => (
                                                        <FormField
                                                            key={user.id}
                                                            control={form.control}
                                                            name="destinatarios"
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem
                                                                        key={user.id}
                                                                        className="flex flex-row items-start space-x-3 space-y-0 mb-2"
                                                                    >
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(user.id)}
                                                                                onCheckedChange={(checked) => {
                                                                                    return checked
                                                                                        ? field.onChange([...(field.value || []), user.id])
                                                                                        : field.onChange(
                                                                                            field.value?.filter(
                                                                                                (value) => value !== user.id
                                                                                            )
                                                                                        )
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal">
                                                                            {user.username}
                                                                        </FormLabel>
                                                                    </FormItem>
                                                                )
                                                            }}
                                                        />
                                                    ))
                                                )}
                                            </ScrollArea>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
