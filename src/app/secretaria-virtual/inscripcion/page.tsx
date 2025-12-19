'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, User } from 'lucide-react';
import Link from 'next/link';

export default function InscripcionPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Inscripción a: Acceso al SEM (CATRP) (OP)</CardTitle>
                    <CardDescription>
                        Selecciona un método para continuar con la inscripción.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col space-y-4 py-4">
                    <Link href="/secretaria-virtual/inscripcion/datos" passHref>
                        <Button variant="outline" size="lg" className="h-16 w-full flex items-center justify-start gap-4 text-left">
                            <User className="h-6 w-6 text-muted-foreground" />
                            <div className='flex flex-col'>
                                <span className="font-semibold">Datos</span>
                                <span className="text-xs text-muted-foreground">Rellenar el formulario manualmente.</span>
                            </div>
                        </Button>
                    </Link>
                    <Button variant="outline" size="lg" className="h-16 w-full flex items-center justify-start gap-4 text-left">
                        <KeyRound className="h-6 w-6 text-muted-foreground" />
                        <div className='flex flex-col'>
                            <span className="font-semibold">Cl@ve</span>
                            <span className="text-xs text-muted-foreground">Identificación segura con el sistema Cl@ve.</span>
                        </div>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
