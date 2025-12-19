'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Play, Square } from 'lucide-react';

type ServicioSEMProps = {
    activeServiceId: string | null;
    elapsedTime: string;
    isLoading: boolean;
    onStartService: () => void;
    onStopService: () => void;
};


export default function ServicioSEM({
    activeServiceId,
    elapsedTime,
    isLoading,
    onStartService,
    onStopService
}: ServicioSEMProps) {
    return (
        <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Control de Servicio</CardTitle>
                    <CardDescription>Registra el inicio y fin de tu turno de servicio.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-8 p-10">
                    <div className="text-6xl font-mono font-bold text-center bg-gray-900 text-green-400 p-4 rounded-lg w-full">
                        {elapsedTime}
                    </div>

                    <div className="flex w-full gap-4">
                        <Button
                            onClick={onStartService}
                            disabled={isLoading || !!activeServiceId}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            size="lg"
                        >
                            <Play className="mr-2" />
                            Ingreso en Servicio
                        </Button>
                        <Button
                            onClick={onStopService}
                            disabled={isLoading || !activeServiceId}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            size="lg"
                        >
                            <Square className="mr-2" />
                            Salir de Servicio
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
