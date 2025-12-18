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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const rolesDisponibles = ["SEM", "Instructor", "Instructor Gestion", "Dirección", "Facciones Legales"] as const;

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  apellidos: z.string().min(1, "Los apellidos son obligatorios."),
  dni: z.string().min(1, "El DNI es obligatorio."),
  role: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Tienes que seleccionar al menos un rol.",
  }),
  fotoPerfil: z.any().optional(), // No podemos procesar ficheros por ahora
  email: z.string().email("El correo electrónico no es válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  repetirPassword: z.string(),
}).refine((data) => data.password === data.repetirPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["repetirPassword"],
});


export default function CrearUsuarioForm() {
    const { toast } = useToast();
    const auth = useAuth();
    const firestore = useFirestore();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: "",
            apellidos: "",
            dni: "",
            role: [],
            email: "",
            password: "",
            repetirPassword: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // 1. Crear usuario en Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            // 2. Subir la foto de perfil (simulado por ahora)
            const fotoUrl = 'https://i.ibb.co/Zp52CWM6/SINFOTO.gif';

            // 3. Guardar la información del usuario en Firestore
            const userDocRef = doc(firestore, "users", user.uid);
            const newUserProfile = {
                id: user.uid,
                email: values.email,
                username: `${values.nombre} ${values.apellidos}`,
                nombre: values.nombre,
                apellidos: values.apellidos,
                dni: values.dni,
                role: values.role,
                fotoUrl: fotoUrl,
            };
            
            await setDoc(userDocRef, newUserProfile);

            toast({
                title: "Usuario Creado con Éxito",
                description: `El usuario ${values.nombre} ha sido registrado.`,
            });

            form.reset(); // Limpiar el formulario

        } catch (error: any) {
            console.error("Error al crear usuario:", error);
            let description = "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.";
            if (error.code === 'auth/email-already-in-use') {
                description = "El correo electrónico introducido ya está en uso.";
            } else if (error.code === 'auth/weak-password') {
                description = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
            } else {
                description = error.message; // Mostrar el mensaje de error real de Firestore/Auth
            }
            toast({
                variant: "destructive",
                title: "Error al crear el usuario",
                description: description,
            });
        }
    }

    return (
        <div className="flex-grow p-6 overflow-auto">
            <h2 className="text-2xl font-bold mb-6">Crear Nuevo Usuario</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="apellidos"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Apellidos</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="dni"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>DNI</FormLabel>
                                    <FormControl>
                                        <Input placeholder="12345678A" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="nombre@ejemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contraseña</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="repetirPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Repetir Contraseña</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                     <FormField
                        control={form.control}
                        name="fotoPerfil"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Foto de Perfil</FormLabel>
                                <FormControl>
                                    <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                                </FormControl>
                                <FormDescription>La subida de archivos no está implementada, pero el campo es requerido.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="role"
                        render={() => (
                            <FormItem>
                                <div className="mb-4">
                                    <FormLabel className="text-base">Roles</FormLabel>
                                    <FormDescription>
                                        Selecciona uno o más roles para el usuario.
                                    </FormDescription>
                                </div>
                                {rolesDisponibles.map((rol) => (
                                    <FormField
                                        key={rol}
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => {
                                            return (
                                                <FormItem
                                                    key={rol}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(rol)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...field.value, rol])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                            (value) => value !== rol
                                                                        )
                                                                    )
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        {rol}
                                                    </FormLabel>
                                                </FormItem>
                                            )
                                        }}
                                    />
                                ))}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Nota Informativa</AlertTitle>
                        <AlertDescription>
                            Se recomienda guardar las contraseñas en excel.
                        </AlertDescription>
                    </Alert>


                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Creando...' : 'Crear Usuario'}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
