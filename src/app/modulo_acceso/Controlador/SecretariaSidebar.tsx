'use client';

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Image from "next/image";

type SecretariaSidebarProps = {
    onSelectOption: (option: 'tramites') => void;
};

export default function SecretariaSidebar({ onSelectOption }: SecretariaSidebarProps) {
  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col space-y-4 shadow-md">
        <div className="flex justify-center mb-4">
            <Image
              src="https://i.ibb.co/gZvGkphp/Dise-o-sin-t-tulo-14-1.png"
              alt="Logo Secretaría"
              width={150}
              height={100}
              data-ai-hint="logo"
            />
        </div>

      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('tramites')}>
        <FileText className="h-5 w-5" />
        <span>Trámites</span>
      </Button>
      
    </div>
  )
}
