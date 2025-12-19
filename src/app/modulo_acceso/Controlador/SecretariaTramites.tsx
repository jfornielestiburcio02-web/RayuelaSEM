'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SecretariaTramites() {
  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
        <h2 className="text-2xl font-bold mb-6">Trámites Disponibles</h2>
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">
                        Curso para dominar el uso del VIR
                    </CardTitle>
                    <Button>Abrir</Button>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">
                        Curso para el tratamiento avanzado (RCP) II
                    </CardTitle>
                    <Button>Abrir</Button>
                </CardHeader>
            </Card>
        </div>
    </div>
  );
}
