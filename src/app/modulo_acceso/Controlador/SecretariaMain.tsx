'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SecretariaMain() {
  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Panel de Secretaría</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground mt-2">
                        Bienvenido al panel de Secretaría. Las funcionalidades para esta sección están en desarrollo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Próximamente podrás gestionar tareas administrativas desde aquí.</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
