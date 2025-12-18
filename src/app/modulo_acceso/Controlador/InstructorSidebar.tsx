'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { ClipboardCheck, FileText, CalendarDays, Clock, Megaphone, ClipboardList, MessageSquare, Inbox } from "lucide-react";

type InstructorSidebarProps = {
    onSelectOption: (option: 'main' | 'faltasPorMateria' | 'informesEnviados' | 'gestionFaltas' | 'verServicios' | 'crearAnuncio' | 'registrosFeedback' | 'bandejaDeEntrada') => void;
};

export default function InstructorSidebar({ onSelectOption }: InstructorSidebarProps) {
  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col space-y-4 shadow-md pt-8">

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
                <ClipboardList className="h-5 w-5" />
                <span>Registros</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuLabel>Ver Registros</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSelectOption('registrosFeedback')}>Positivos y Negativos</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('faltasPorMateria')}>
        <ClipboardCheck className="h-5 w-5" />
        <span>Faltas por Materia</span>
      </Button>

       <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('gestionFaltas')}>
        <CalendarDays className="h-5 w-5" />
        <span>Gestión Faltas</span>
      </Button>

      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('informesEnviados')}>
        <FileText className="h-5 w-5" />
        <span>Informes Enviados</span>
      </Button>

      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('verServicios')}>
        <Clock className="h-5 w-5" />
        <span>Servicios</span>
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
          <DropdownMenuItem onClick={() => onSelectOption('crearAnuncio')}>
            <Megaphone className="mr-2 h-4 w-4" />
            <span>Crear Anuncio</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </div>
  )
}
