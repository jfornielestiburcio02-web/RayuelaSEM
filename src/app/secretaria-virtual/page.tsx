'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type TramiteActivo = {
    id: string;
    nombre: string;
};

function PublicTramitesList() {
    const firestore = useFirestore();

    const tramitesActivosQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'tramitesActivos');
    }, [firestore]);

    const { data: tramitesActivos, isLoading: isLoadingTramites } = useCollection<TramiteActivo>(tramitesActivosQuery);

    return (
        <Card className="w-full max-w-3xl">
            <CardHeader>
                <CardTitle>Trámites Disponibles</CardTitle>
                <CardDescription>Estos son los cursos y trámites actualmente abiertos.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                    {/* Trámite fijo */}
                    <Card key="acceso-sem">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                            <CardTitle className="text-base font-medium">
                                Acceso al SEM (CATRP) (OP)
                            </CardTitle>
                            <Button asChild>
                                <Link href="/modulo_acceso/identificacion">Inscribirse</Link>
                            </Button>
                        </CardHeader>
                    </Card>

                    {/* Trámites dinámicos */}
                    {isLoadingTramites ? (
                        <p className="text-center text-muted-foreground pt-4">Cargando otros trámites...</p>
                    ) : tramitesActivos && tramitesActivos.length > 0 ? (
                        tramitesActivos.map((tramite) => (
                            <Card key={tramite.id}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                                    <CardTitle className="text-base font-medium">
                                        {tramite.nombre}
                                    </CardTitle>
                                    <Button asChild>
                                        <Link href="/modulo_acceso/identificacion">Inscribirse</Link>
                                    </Button>
                                </CardHeader>
                            </Card>
                        ))
                    ) : (
                        <div className="p-6 text-center">
                            <p className="text-muted-foreground">No hay otros trámites disponibles en este momento.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function SecretariaVirtualPage() {
    return (
        <main
            className="flex min-h-screen flex-col items-center p-4 bg-white pt-24"
        >
            <PublicTramitesList />
        </main>
    );
}
