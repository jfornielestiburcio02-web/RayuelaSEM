'use client';

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FolderKanban, Gavel, FileClock, ShieldCheck, MessageSquare, Inbox } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type FaccionesLegalesSidebarProps = {
    onSelectOption: (option: 'expedientesAbsentistas' | 'faltasAsistencia' | 'conducta' | 'expulsarUsuario' | 'enviarMensaje' | 'bandejaDeEntrada') => void;
};

export default function FaccionesLegalesSidebar({ onSelectOption }: FaccionesLegalesSidebarProps) {
  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col space-y-4 shadow-md">
        <div className="flex justify-center mb-4">
            <Image
              src="https://i.ibb.co/QvhjS6YL/Facciones-Legales-3.png"
              alt="Logo Facciones Legales"
              width={150}
              height={100}
              data-ai-hint="logo"
            />
        </div>

      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('expedientesAbsentistas')}>
        <FolderKanban className="h-5 w-5" />
        <span>Expedientes Absentistas</span>
      </Button>
      
      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('faltasAsistencia')}>
        <FileClock className="h-5 w-5" />
        <span>Faltas de Asistencia</span>
      </Button>

      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('conducta')}>
        <ShieldCheck className="h-5 w-5" />
        <span>Conducta</span>
      </Button>

      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('expulsarUsuario')}>
        <Gavel className="h-5 w-5" />
        <span>Expulsar Usuario</span>
      </Button>
      
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
          <DropdownMenuItem onClick={() => onSelectOption('enviarMensaje')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Enviar Mensaje</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>


    </div>
  )
}
