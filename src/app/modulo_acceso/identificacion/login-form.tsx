"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { KeyRound, User } from "lucide-react";
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  email: z.string().email({ message: "El correo electrónico no es válido." }),
  password: z.string().min(1, { message: "La contraseña es obligatoria." }),
});

export default function LoginForm() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, values.email, values.password);

      toast({
        title: "Inicio de sesión exitoso",
        description: "¡Bienvenido de vuelta!",
      });
      router.push('/modulo_acceso/Contenedor'); // Redirect to the container page
    } catch (error: any) {
        let description = "Credenciales incorrectas o error de conexión.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            description = "El correo electrónico o la contraseña son incorrectos.";
        } else if (error.code === 'auth/invalid-credential') {
            description = "Las credenciales proporcionadas no son válidas.";
        }
        console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: description,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Correo Electrónico</FormLabel>
              <FormControl>
                <div className="relative flex items-center">
                  <User className="absolute left-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <Input placeholder="nombre@ejemplo.com" {...field} className="pl-10 bg-white" />
                </div>
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
              <FormLabel className="text-white">Contraseña</FormLabel>
              <FormControl>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <Input type="password" placeholder="••••••••" {...field} className="pl-10 bg-white" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col items-center space-y-4 pt-4">
          <Button type="submit" size="sm" className="bg-black hover:bg-black/90 text-white font-bold px-8 w-full">
            Entrar
          </Button>
           <Separator className="bg-white/20 my-4" />
           <Link href="/secretaria-virtual" className="text-white hover:underline text-sm font-medium">
             Secretaría Virtual
           </Link>
        </div>
      </form>
    </Form>
  );
}
