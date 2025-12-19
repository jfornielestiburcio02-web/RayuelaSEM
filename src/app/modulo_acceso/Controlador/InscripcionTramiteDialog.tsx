'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type TramiteActivo = {
    id: string;
    nombre: string;
};

type InscripcionTramiteDialogProps = {
    tramite: TramiteActivo;
};

export default function InscripcionTramiteDialog({ tramite }: InscripcionTramiteDialogProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInscripcion = async () => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para inscribirte.' });
            return;
        }

        setIsSubmitting(true);
        const inscripcionId = `${user.uid}_${tramite.id}`;
        const inscripcionRef = doc(firestore, 'inscripcionesTramites', inscripcionId);

        try {
            await setDoc(inscripcionRef, {
                userId: user.uid,
                tramiteId: tramite.id,
                userName: user.displayName || user.email,
                tramiteName: tramite.nombre,
                status: 'pendiente',
                inscritoEn: serverTimestamp(),
            });
            toast({
                title: 'Inscripción enviada',
                description: `Tu solicitud para "${tramite.nombre}" está pendiente de revisión.`,
            });
            setIsOpen(false);
        } catch (error) {
            console.error("Error al inscribirse en el trámite:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar la inscripción.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Inscribirse</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Inscripción</DialogTitle>
                    <DialogDescription>
                        Estás a punto de inscribirte en el curso: <span className="font-semibold">{tramite.nombre}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p>
                        <span className="font-medium">Usuario:</span> {user?.displayName || user?.email}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Tu solicitud quedará como "Pendiente" hasta que sea revisada por un administrador.
                    </p>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isSubmitting}>Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleInscripcion} disabled={isSubmitting}>
                        {isSubmitting ? 'Inscribiendo...' : 'Aceptar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
