'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SecretariaTramites() {
  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
        <h2 className="text-2xl font-bold mb-6">Trámites Disponibles</h2>
        <Card>
            <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No hay trámites disponibles en este momento.</p>
            </CardContent>
        </Card>
    </div>
  );
}
