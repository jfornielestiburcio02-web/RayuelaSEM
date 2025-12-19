'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";


export default function SecretariaTramites() {
  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
        <h2 className="text-2xl font-bold mb-6">Trámites Disponibles</h2>
        <Card>
            <CardContent className="p-0">
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Curso para dominar el uso del VIR</h3>
                            <p className="text-sm text-muted-foreground">Formación especializada en Vehículos de Intervención Rápida.</p>
                        </div>
                        <Button>Abrir</Button>
                    </div>
                </div>
                <Separator />
                <div className="p-6">
                    <div className="flex items-center justify-between">
                         <div>
                            <h3 className="text-lg font-semibold">Curso para el tratamiento avanzado (RCP) II</h3>
                            <p className="text-sm text-muted-foreground">Capacitación avanzada en Reanimación Cardiopulmonar.</p>
                        </div>
                        <Button>Abrir</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
