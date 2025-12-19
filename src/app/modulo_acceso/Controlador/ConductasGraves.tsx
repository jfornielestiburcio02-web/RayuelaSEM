'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import RegistroConductaForm from './RegistroConductaForm';

type UserDoc = {
  id: string;
  username: string;
};

type ConductaDoc = {
  id: string;
  alumnoId: string;
}

export default function ConductasGraves() {
  const firestore = useFirestore();
  const [selectedUser, setSelectedUser] = useState<UserDoc | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), where('role', 'array-contains', 'SEM')) : null),
    [firestore]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserDoc>(usersQuery);

  const conductasQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'conductas') : null),
    [firestore]
  );
  const { data: conductas, isLoading: isLoadingConductas } = useCollection<ConductaDoc>(conductasQuery);

  const conductCounts = useMemo(() => {
    if (!conductas) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const conducta of conductas) {
      counts.set(conducta.alumnoId, (counts.get(conducta.alumnoId) || 0) + 1);
    }
    return counts;
  }, [conductas]);


  const handleNewRegistro = (user: UserDoc) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };
  
  const isLoading = isLoadingUsers || isLoadingConductas;

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
                      <TableCell className="font-medium">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="link" className="p-0 h-auto font-medium">{user.username}</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleNewRegistro(user)}>
                              Nuevo registro
                            </DropdownMenuItem>
                            <DropdownMenuItem>Ver registros</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>{conductCounts.get(user.id) || 0}</TableCell>
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
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Nuevo Registro de Conducta para {selectedUser?.username}</DialogTitle>
                <DialogDescription>
                    Rellena todos los campos para documentar el incidente.
                </DialogDescription>
            </DialogHeader>
            {selectedUser && (
                <RegistroConductaForm user={selectedUser} onFinished={handleCloseForm} />
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
