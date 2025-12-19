'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SolicitudesAccesoSem() {

  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
      <Card>
        <CardHeader>
            <CardTitle>Solicitudes de Acceso al SEM</CardTitle>
            <CardDescription>Aquí puedes ver y gestionar las solicitudes de los nuevos aspirantes.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center text-muted-foreground py-8">
                <p>En construcción.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
