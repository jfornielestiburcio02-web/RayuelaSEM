'use client';

import { Button } from "@/components/ui/button";
import { ClipboardCheck, FileCheck, Megaphone, History, FilePlus, Clock, SmilePlus, MessageSquare } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

type SemSidebarProps = {
    onSelectOption: (option: 'anuncios' | 'misFaltas' | 'nuevaJustificacion' | 'historialJustificaciones' | 'crearInforme' | 'servicio' | 'misFeedbacks' | 'mensajeria') => void;
};

export default function SemSidebar({ onSelectOption }: SemSidebarProps) {
  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col space-y-4 shadow-md pt-8">
      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('anuncios')}>
        <Megaphone className="h-5 w-5" />
        <span>Bandeja de Entrada</span>
      </Button>

      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('mensajeria')}>
        <MessageSquare className="h-5 w-5" />
        <span>Enviar Mensaje</span>
      </Button>

      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('misFaltas')}>
        <ClipboardCheck className="h-5 w-5" />
        <span>Mis Faltas</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
                <FileCheck className="h-5 w-5" />
                <span>Justificar Ausencias</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuLabel>Gestionar Justificaciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSelectOption('nuevaJustificacion')}>Nueva Justificación</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSelectOption('historialJustificaciones')}>Ver Historial</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

       <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
                <SmilePlus className="h-5 w-5" />
                <span>Conducta</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuLabel>Mi Conducta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSelectOption('misFeedbacks')}>Negativos y Positivos</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('crearInforme')}>
        <FilePlus className="h-5 w-5" />
        <span>Crear Nuevo Informe</span>
      </Button>

      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('servicio')}>
        <Clock className="h-5 w-5" />
        <span>Servicio</span>
      </Button>

    </div>
  )
}
