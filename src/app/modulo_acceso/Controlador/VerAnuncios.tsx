'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, orderBy, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';

type AnuncioDoc = {
    id: string;
    descripcion: string;
    detalle: string;
    creadoPor: string;
    creadoEn: Timestamp;
    para: string[];
};

type UserProfile = {
  role: string[];
};


export default function VerAnuncios() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(
      () => (currentUser ? doc(firestore, 'users', currentUser.uid) : null),
      [currentUser, firestore]
    );
    const { data: userData } = useDoc<UserProfile>(userDocRef);


    const anunciosQuery = useMemoFirebase(() => {
        if (!firestore || !currentUser || !userData) return null;
        
        const userRoles = userData.role || [];
        const targetGroups = [currentUser.uid];

        if (userRoles.includes('SEM')) {
            targetGroups.push('TODOS_SEM');
        }
        if (userRoles.includes('Instructor')) {
            targetGroups.push('TODOS_INSTRUCTORES');
        }
        if (userRoles.includes('Dirección')) {
            targetGroups.push('TODOS_DIRECCION');
        }
        // A user can always receive messages to "TODOS", although we are moving away from it.
        targetGroups.push('TODOS');
        

        return query(
            collection(firestore, 'anuncios'),
            where('para', 'array-contains-any', targetGroups),
            orderBy('creadoEn', 'desc')
        );
    }, [firestore, currentUser, userData]);

    const { data: anuncios, isLoading } = useCollection<AnuncioDoc>(anunciosQuery);

    const handleDelete = async (anuncioId: string) => {
        if (!firestore) return;
        const anuncioRef = doc(firestore, 'anuncios', anuncioId);
        try {
            await deleteDoc(anuncioRef);
            toast({
                title: "Mensaje eliminado",
                description: "El mensaje ha sido eliminado correctamente.",
            });
        } catch (error) {
            console.error("Error deleting announcement:", error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "No se pudo eliminar el mensaje.",
            });
        }
    };


    const formatDate = (timestamp: Timestamp | null | undefined) => {
        if (!timestamp) return 'Fecha desconocida';
        return format(timestamp.toDate(), 'PPP p', { locale: es });
    };

    return (
        <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-2xl font-bold mb-6">Bandeja de Entrada</h2>
            {isLoading && <p className='text-center text-muted-foreground'>Cargando mensajes...</p>}
            {!isLoading && (!anuncios || anuncios.length === 0) && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">No tienes mensajes nuevos.</p>
                    </CardContent>
                </Card>
            )}
            {!isLoading && anuncios && anuncios.length > 0 && (
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {anuncios.map((anuncio) => (
                        <AccordionItem value={anuncio.id} key={anuncio.id}>
                             <Card className='overflow-hidden'>
                                <div className="flex items-center p-6">
                                    <AccordionTrigger className="flex-1 text-left hover:no-underline p-0">
                                        <div>
                                            <p className="font-bold text-lg">{anuncio.descripcion}</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {formatDate(anuncio.creadoEn)}
                                            </p>
                                        </div>
                                    </AccordionTrigger>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="ml-4">
                                                <Trash2 className="h-5 w-5 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. El mensaje se eliminará permanentemente.
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
                                </div>
                                <AccordionContent>
                                    <CardContent className='pt-0 pl-6 pb-6 pr-6'>
                                        <div className='prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap'>
                                            {anuncio.detalle}
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
