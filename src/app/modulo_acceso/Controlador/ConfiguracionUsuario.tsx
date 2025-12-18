
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const formSchema = z.object({
  fotoUrl: z.string().url("Por favor, introduce una URL válida."),
});

type UserProfile = {
  username?: string;
  fotoUrl?: string;
};

export default function ConfiguracionUsuario() {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [user, firestore]
    );

    const { data: userData, isLoading } = useDoc<UserProfile>(userDocRef);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        values: {
            fotoUrl: userData?.fotoUrl || '',
        },
        resetOptions: {
            keepValues: false,
        }
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!userDocRef) return;
        
        try {
            await updateDoc(userDocRef, {
                fotoUrl: values.fotoUrl
            });
            toast({
                title: "Perfil Actualizado",
                description: "Tu foto de perfil ha sido cambiada con éxito.",
            });
        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo actualizar la foto de perfil.",
            });
        }
    }

    const getInitials = (name: string = '') => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <div className="flex-grow p-6 overflow-auto">
            <h2 className="text-2xl font-bold mb-6">Configuración del Perfil</h2>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Tu Perfil</CardTitle>
                    <CardDescription>Aquí puedes cambiar tu foto de perfil.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Cargando perfil...</p>
                    ) : (
                        <div className="flex flex-col items-center gap-8 md:flex-row">
                            <div className="flex flex-col items-center gap-4">
                                <Avatar className="w-32 h-32">
                                    <AvatarImage src={userData?.fotoUrl} alt={userData?.username} />
                                    <AvatarFallback className="text-4xl">{getInitials(userData?.username)}</AvatarFallback>
                                </Avatar>
                                <p className="font-semibold">{userData?.username}</p>
                            </div>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex-1 w-full">
                                    <FormField
                                        control={form.control}
                                        name="fotoUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>URL de la Foto de Perfil</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://ejemplo.com/tu-foto.png" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Pega la URL de tu nueva foto de perfil.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
