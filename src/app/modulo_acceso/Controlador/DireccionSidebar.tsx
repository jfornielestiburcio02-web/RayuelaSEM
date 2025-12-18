'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Users, Home, MessageSquare, Inbox } from "lucide-react";

type DireccionSidebarProps = {
    onSelectOption: (option: 'main' | 'createUser' | 'editUser' | 'crearMensaje' | 'bandejaDeEntrada') => void;
};

export default function DireccionSidebar({ onSelectOption }: DireccionSidebarProps) {
  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col space-y-4 shadow-md">
        <div className="flex justify-center mb-4">
            <Image
              src="https://i.ibb.co/MkrCfjxB/Dise-o-sin-t-tulo-7-1.png"
              alt="Logo"
              width={150}
              height={100}
              data-ai-hint="logo"
            />
        </div>

      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('main')}>
        <Home className="h-5 w-5" />
        <span>Inicio Dirección</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
                <Users className="h-5 w-5" />
                <span>Usuarios</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuLabel>Gestionar Usuarios</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSelectOption('createUser')}>Crear Usuario</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSelectOption('editUser')}>Editar Usuarios</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
                <MessageSquare className="h-5 w-5" />
                <span>Mensajería</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuLabel>Gestionar Mensajes</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSelectOption('bandejaDeEntrada')}>
            <Inbox className="mr-2 h-4 w-4" />
            <span>Bandeja de Entrada</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSelectOption('crearMensaje')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Crear Mensaje</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
