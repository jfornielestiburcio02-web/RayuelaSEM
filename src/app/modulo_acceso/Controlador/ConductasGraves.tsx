'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type UserDoc = {
  id: string;
  username: string;
};

export default function ConductasGraves() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), where('role', 'array-contains', 'SEM')) : null),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<UserDoc>(usersQuery);

  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
      <Card>
        <CardHeader>
          <CardTitle>Conductas Contrarias / Graves</CardTitle>
          <CardDescription>
            Listado de todos los usuarios SEM y sus registros de conducta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground">Cargando usuarios...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre de Usuario</TableHead>
                  <TableHead>Registros totales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>0</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">
                      No se encontraron usuarios SEM.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
