'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, KeyRound } from 'lucide-react';

type Tramite = {
    id: string;
    nombre: string;
};

type InscripcionVirtualDialogProps = {
    tramite: Tramite;
};

export default function InscripcionVirtualDialog({ tramite }: InscripcionVirtualDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Inscribirse</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Inscripción a: {tramite.nombre}</DialogTitle>
                    <DialogDescription>
                        Selecciona un método para continuar con la inscripción.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col space-y-4 py-4">
                    <Button variant="outline" size="lg" className="h-16 flex items-center justify-start gap-4 text-left">
                        <User className="h-6 w-6 text-muted-foreground" />
                        <div className='flex flex-col'>
                            <span className="font-semibold">Datos</span>
                            <span className="text-xs text-muted-foreground">Rellenar el formulario manualmente.</span>
                        </div>
                    </Button>
                    <Button variant="outline" size="lg" className="h-16 flex items-center justify-start gap-4 text-left">
                        <KeyRound className="h-6 w-6 text-muted-foreground" />
                        <div className='flex flex-col'>
                            <span className="font-semibold">Cl@ve</span>
                            <span className="text-xs text-muted-foreground">Identificación segura con el sistema Cl@ve.</span>
                        </div>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
