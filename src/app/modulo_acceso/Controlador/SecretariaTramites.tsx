'use client';

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/firebase";
import { doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const tramites = [
    {
        id: 'curso-vir',
        nombre: 'Curso para dominar el uso del VIR',
    },
    {
        id: 'curso-rcp-avanzado',
        nombre: 'Curso para el tratamiento avanzado (RCP) II',
    }
];

export default function SecretariaTramites() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleOpenTramite = async (tramite: { id: string; nombre: string }) => {
        if (!firestore) return;
        const tramiteRef = doc(firestore, 'tramitesActivos', tramite.id);
        try {
            await setDoc(tramiteRef, {
                id: tramite.id,
                nombre: tramite.nombre,
                activadoEn: serverTimestamp(),
            });
            toast({
                title: 'Trámite Activado',
                description: `El "${tramite.nombre}" ahora está disponible para los ciudadanos.`,
            });
        } catch (error) {
            console.error("Error al activar el trámite:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo activar el trámite.' });
        }
    };
    
    const handleCloseTramite = async (tramiteId: string) => {
        if (!firestore) return;
        const tramiteRef = doc(firestore, 'tramitesActivos', tramiteId);
        try {
            await deleteDoc(tramiteRef);
            toast({
                title: 'Trámite Desactivado',
                description: `El trámite ha sido cerrado para los ciudadanos.`,
                variant: 'destructive'
            });
        } catch (error) {
            console.error("Error al desactivar el trámite:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo desactivar el trámite.' });
        }
    };

    return (
        <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-2xl font-bold mb-6">Gestionar Trámites para Ciudadanos</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Trámites Disponibles</CardTitle>
                </CardHeader>
                <div className="p-6 pt-0 space-y-4">
                    {tramites.map((tramite) => (
                        <Card key={tramite.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">
                                    {tramite.nombre}
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleOpenTramite(tramite)}>Activar</Button>
                                    <Button variant="destructive" onClick={() => handleCloseTramite(tramite.id)}>Desactivar</Button>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </Card>
        </div>
    );
}
