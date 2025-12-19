'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type TramiteActivo = {
    id: string;
    nombre: string;
};

type AnuncioSecretariaDoc = {
    id: string;
    titulo: string;
    imageUrl?: string;
    descripcion: string;
    creadoEn: Timestamp;
};


function PublicTramitesList() {
    const firestore = useFirestore();

    const tramitesActivosQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'tramitesActivos');
    }, [firestore]);

    const { data: tramitesActivos, isLoading: isLoadingTramites } = useCollection<TramiteActivo>(tramitesActivosQuery);
    
    const tramiteFijo = {
        id: 'acceso-sem',
        nombre: 'Acceso al SEM (CATRP) (OP)',
    }

    const anunciosSecretariaQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'anunciosSecretaria'), orderBy('creadoEn', 'desc')) : null,
      [firestore]
    );
    const { data: anunciosSecretaria, isLoading: isLoadingAnuncios } = useCollection<AnuncioSecretariaDoc>(anunciosSecretariaQuery);

    const formatDate = (timestamp?: Timestamp) => timestamp ? format(timestamp.toDate(), 'PPP', { locale: es }) : '';


    return (
        <div className="w-full max-w-3xl space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Trámites Disponibles</CardTitle>
                    <CardDescription>Estos son los cursos y trámites actualmente abiertos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Trámite fijo */}
                        <Card key={tramiteFijo.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                                <CardTitle className="text-base font-medium">
                                    {tramiteFijo.nombre}
                                </CardTitle>
                                <Link href="/secretaria-virtual/inscripcion" passHref>
                                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                        Inscribirse
                                    </button>
                                </Link>
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
                                        <Link href="/secretaria-virtual/inscripcion" passHref>
                                            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                                Inscribirse
                                            </button>
                                        </Link>
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

            <Card>
                <CardHeader>
                    <CardTitle>Anuncios Importantes</CardTitle>
                </CardHeader>
                 <CardContent>
                        {isLoadingAnuncios ? (
                             <p>Cargando anuncios...</p>
                        ) : anunciosSecretaria && anunciosSecretaria.length > 0 ? (
                            <div className="space-y-6">
                                {anunciosSecretaria.map((anuncio) => (
                                    <Card key={anuncio.id} className="overflow-hidden">
                                        {anuncio.imageUrl && (
                                            <div className="relative h-48 w-full">
                                                <Image src={anuncio.imageUrl} alt={anuncio.titulo} layout="fill" objectFit="cover" />
                                            </div>
                                        )}
                                        <CardHeader>
                                            <CardTitle>{anuncio.titulo}</CardTitle>
                                            <CardDescription>{formatDate(anuncio.creadoEn)}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm whitespace-pre-wrap">{anuncio.descripcion}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                             <div className="p-6 text-center">
                                <p className="text-muted-foreground">No hay anuncios en este momento.</p>
                            </div>
                        )}
                    </CardContent>
            </Card>
        </div>
    );
}

export default function SecretariaVirtualPage() {
    return (
        <main
            className="flex min-h-screen flex-col items-center p-4 bg-white pt-24 pb-12"
        >
            <PublicTramitesList />
        </main>
    );
}
