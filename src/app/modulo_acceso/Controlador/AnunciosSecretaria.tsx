'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, serverTimestamp, query, orderBy, doc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const formSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio.'),
  imageUrl: z.string().url('Debe ser una URL de imagen válida.').optional().or(z.literal('')),
  descripcion: z.string().min(1, 'La descripción es obligatoria.'),
});

type AnuncioFormValues = z.infer<typeof formSchema>;

type AnuncioSecretariaDoc = {
    id: string;
    titulo: string;
    imageUrl?: string;
    descripcion: string;
    creadoEn: Timestamp;
};

export default function AnunciosSecretaria() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<AnuncioFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            titulo: '',
            imageUrl: '',
            descripcion: '',
        }
    });

    const anunciosQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'anunciosSecretaria'), orderBy('creadoEn', 'desc')) : null,
      [firestore]
    );
    const { data: anuncios, isLoading: isLoadingAnuncios } = useCollection<AnuncioSecretariaDoc>(anunciosQuery);

    const onSubmit = async (data: AnuncioFormValues) => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar con la base de datos.' });
            return;
        }

        try {
            await addDoc(collection(firestore, 'anunciosSecretaria'), {
                ...data,
                creadoEn: serverTimestamp(),
            });

            toast({
                title: 'Anuncio Publicado',
                description: 'El anuncio se ha publicado correctamente.',
            });
            form.reset();

        } catch (error) {
            console.error("Error al publicar anuncio:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo publicar el anuncio.' });
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'anunciosSecretaria', id));
            toast({
                title: 'Anuncio Eliminado',
                description: 'El anuncio ha sido eliminado.',
                variant: 'destructive',
            });
        } catch (error) {
             console.error("Error al eliminar anuncio:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el anuncio.' });
        }
    };
    
    const formatDate = (timestamp?: Timestamp) => {
        return timestamp ? format(timestamp.toDate(), 'PPP p', { locale: es }) : '';
    };

    return (
        <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50 space-y-8">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Crear Anuncio Público</CardTitle>
                    <CardDescription>
                        Crea un nuevo anuncio que será visible para todos los ciudadanos en su panel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                             <FormField
                                control={form.control}
                                name="titulo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="imageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL de la Imagen (Opcional)</FormLabel>
                                        <FormControl><Input placeholder='https://ejemplo.com/imagen.png' {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="descripcion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descripción</FormLabel>
                                        <FormControl><Textarea className="min-h-32" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Publicando...' : 'Publicar Anuncio'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <div className="max-w-4xl mx-auto">
                <h3 className="text-xl font-bold mb-4">Anuncios Publicados</h3>
                 {isLoadingAnuncios && <p className='text-center text-muted-foreground'>Cargando anuncios...</p>}
                {!isLoadingAnuncios && (!anuncios || anuncios.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">No hay anuncios publicados.</p>
                )}
                 {!isLoadingAnuncios && anuncios && anuncios.length > 0 && (
                    <div className='space-y-4'>
                        {anuncios.map(anuncio => (
                            <Card key={anuncio.id}>
                                <CardHeader>
                                    <CardTitle>{anuncio.titulo}</CardTitle>
                                    <CardDescription>{formatDate(anuncio.creadoEn)}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     {anuncio.imageUrl && (
                                        <div className='relative h-60 w-full'>
                                            <Image src={anuncio.imageUrl} alt={anuncio.titulo} layout='fill' objectFit='cover' className='rounded-md' />
                                        </div>
                                     )}
                                     <p className="text-sm">{anuncio.descripcion}</p>
                                </CardContent>
                                <CardFooter>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm"><Trash2 className='mr-2 h-4 w-4' />Eliminar</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Se eliminará el anuncio permanentemente.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(anuncio.id)}>
                                                    Eliminar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
