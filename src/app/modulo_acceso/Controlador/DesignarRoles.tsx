'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const rolesProfesionales = ["Médico", "Enfermero", "TES"] as const;
const rangos = ["Comandant", "SAO", "Dir Área", "Dir Metge", "Dir Enf.", "Dir TES", "Cap´d area", "Cap territorial", "Sotcap Territorial", "Cap´d operaciones", "Coord. Clinico. Op."] as const;

const formSchema = z.object({
  userId: z.string().min(1, "Debes seleccionar un usuario."),
  rolProfesional: z.string().min(1, "Debes seleccionar un rol profesional."),
  rango: z.string().min(1, "Debes seleccionar un rango."),
});

type DesignarRolesFormValues = z.infer<typeof formSchema>;

type UserDoc = {
  id: string;
  username: string;
  rolProfesional?: string;
  rango?: string;
};

export default function DesignarRoles() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserDoc>(usersCollectionRef);

  const form = useForm<DesignarRolesFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      rolProfesional: '',
      rango: '',
    },
  });

  const { setValue, watch } = form;
  const selectedUserId = watch('userId');

  useEffect(() => {
    if (selectedUserId && users) {
      const selectedUser = users.find(u => u.id === selectedUserId);
      if (selectedUser) {
        setValue('rolProfesional', selectedUser.rolProfesional || '');
        setValue('rango', selectedUser.rango || '');
      }
    }
  }, [selectedUserId, users, setValue]);


  const onSubmit = async (data: DesignarRolesFormValues) => {
    if (!firestore) return;
    try {
        const userDocRef = doc(firestore, 'users', data.userId);
        await updateDoc(userDocRef, {
            rolProfesional: data.rolProfesional,
            rango: data.rango
        });

        toast({
            title: "Roles designados con éxito",
            description: `Se han actualizado los roles para el usuario seleccionado.`,
        });
        form.reset();
    } catch (error) {
        console.error("Error al designar roles:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron actualizar los roles del usuario.",
        });
    }
  };

  const handleEditClick = (user: UserDoc) => {
    form.setValue('userId', user.id);
    form.setValue('rolProfesional', user.rolProfesional || '');
    form.setValue('rango', user.rango || '');
  };


  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50 space-y-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Designar Roles y Rangos</CardTitle>
          <CardDescription>
            Selecciona un usuario y asígnale un rol profesional y un rango. Puedes editar las asignaciones existentes desde el historial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingUsers}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un usuario..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingUsers ? (
                            <SelectItem value="loading" disabled>Cargando usuarios...</SelectItem>
                        ) : (
                            users?.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rolProfesional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol Profesional</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                       <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol..." />
                        </SelectTrigger>
                       </FormControl>
                      <SelectContent>
                        {rolesProfesionales.map(rol => (
                          <SelectItem key={rol} value={rol}>{rol}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rango"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rango</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                       <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rango..." />
                        </SelectTrigger>
                       </FormControl>
                      <SelectContent>
                        {rangos.map(rango => (
                          <SelectItem key={rango} value={rango}>{rango}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Historial de Rangos y Roles</CardTitle>
                <CardDescription>
                    Aquí puedes ver los roles y rangos asignados a cada usuario.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre de Usuario</TableHead>
                            <TableHead>Rol Profesional</TableHead>
                            <TableHead>Rango</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingUsers ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">Cargando historial...</TableCell>
                            </TableRow>
                        ) : (
                            users?.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.rolProfesional || '-'}</TableCell>
                                    <TableCell>{user.rango || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                                            Editar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
