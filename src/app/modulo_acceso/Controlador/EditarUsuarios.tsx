'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const rolesDisponibles = ["SEM", "Instructor", "Instructor Gestion", "Dirección", "Facciones Legales"] as const;

type UserDoc = {
  id: string;
  username: string;
  email: string;
  role: string[];
};

export default function EditarUsuarios() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  
  const { data: users, isLoading } = useCollection<UserDoc>(usersCollectionRef);

  const [editingUser, setEditingUser] = useState<UserDoc | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const handleEditClick = (user: UserDoc) => {
    setEditingUser(user);
    setSelectedRoles(user.role || []);
  };

  const handleRoleChange = (role: string, checked: boolean | 'indeterminate') => {
    if (typeof checked !== 'boolean') return;
    setSelectedRoles(prev => 
      checked ? [...prev, role] : prev.filter(r => r !== role)
    );
  };

  const handleSaveChanges = async () => {
    if (!editingUser || !firestore) return;

    const userDocRef = doc(firestore, 'users', editingUser.id);
    try {
        await updateDoc(userDocRef, { role: selectedRoles });
        toast({
            title: "Roles actualizados",
            description: `Se han actualizado los roles para ${editingUser.username}.`
        });
    } catch (error: any) {
        console.error("Error updating roles:", error);
        toast({
            variant: "destructive",
            title: "Error al actualizar",
            description: error.message || "No se pudieron actualizar los roles."
        });
    }

    setEditingUser(null);
  };

  const handleDeleteUser = async (user: UserDoc) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, "users", user.id);
    try {
        await deleteDoc(userDocRef);
        toast({
            title: "Usuario Eliminado",
            description: `El usuario ${user.username} ha sido eliminado de la base de datos.`,
            variant: "default"
        });
        // Note: This does not delete the user from Firebase Authentication.
    } catch (error: any) {
        console.error("Error deleting user:", error);
        toast({
            variant: "destructive",
            title: "Error al eliminar",
            description: error.message || "No se pudo eliminar el usuario."
        });
    }
  };

  if (isLoading) {
    return <div>Cargando usuarios...</div>;
  }

  return (
    <div className="flex-grow p-6 overflow-auto">
      <h2 className="text-2xl font-bold mb-6">Editar Usuarios</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre de Usuario</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role?.join(', ') || 'Sin rol'}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                  Editar Roles
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={currentUser?.uid === user.id}>Eliminar</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente al usuario
                            de la base de datos de Firestore, pero no del sistema de autenticación de Firebase.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteUser(user)}>
                            Continuar
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editando roles para {editingUser.username}</DialogTitle>
                    <DialogDescription>
                        Selecciona los roles que deseas asignar al usuario.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {rolesDisponibles.map(role => (
                        <div key={role} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`role-${role}`}
                                checked={selectedRoles.includes(role)}
                                onCheckedChange={(checked) => handleRoleChange(role, checked)}
                            />
                            <Label htmlFor={`role-${role}`}>{role}</Label>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
