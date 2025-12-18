'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  userId: z.string().min(1, 'Debes seleccionar un usuario.'),
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres.'),
});

type ExpulsionFormValues = z.infer<typeof formSchema>;

type UserDoc = {
  id: string;
  username: string;
};

export default function ExpulsarUsuarioForm() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('role', 'array-contains-any', ['SEM', 'Instructor'])
    );
  }, [firestore]);

  const { data: users, isLoading: isLoadingUsers } = useCollection<UserDoc>(usersQuery);

  const form = useForm<ExpulsionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      motivo: '',
    },
  });

  const onSubmit = async (data: ExpulsionFormValues) => {
    if (!firestore || !currentUser) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo conectar con la base de datos o el usuario no está autenticado.',
      });
      return;
    }
    
    const selectedUser = users?.find(u => u.id === data.userId);
    if (!selectedUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'Usuario seleccionado no válido.' });
        return;
    }

    try {
      const anunciosCollectionRef = collection(firestore, 'anuncios');
      await addDoc(anunciosCollectionRef, {
        descripcion: `Solicitud de Expulsión: ${selectedUser.username}`,
        detalle: `El usuario de Facciones Legales (${currentUser.email}) ha solicitado la expulsión del usuario ${selectedUser.username} (ID: ${data.userId}).\n\nMotivo: ${data.motivo}`,
        para: ['TODOS_DIRECCION'],
        creadoPor: currentUser.uid,
        creadoEn: serverTimestamp(),
      });

      toast({
        title: 'Solicitud Enviada',
        description: `Se ha enviado la solicitud de expulsión para ${selectedUser.username} a Dirección.`,
      });
      form.reset();

    } catch (error) {
      console.error("Error al enviar la solicitud de expulsión:", error);
      toast({
        variant: 'destructive',
        title: 'Error al enviar la solicitud',
        description: 'Ocurrió un error al intentar guardar la solicitud.',
      });
    }
  };

  return (
    <div className="flex-grow p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Expulsar Usuario</CardTitle>
          <CardDescription>
            Selecciona un usuario y detalla el motivo de la expulsión. La solicitud será enviada a Dirección para su revisión.
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
                    <FormLabel>Usuario a expulsar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingUsers}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingUsers ? "Cargando usuarios..." : "Selecciona un usuario..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo de la expulsión</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe detalladamente los motivos para solicitar la expulsión de este usuario..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Enviando Solicitud...' : 'Enviar Solicitud a Dirección'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    