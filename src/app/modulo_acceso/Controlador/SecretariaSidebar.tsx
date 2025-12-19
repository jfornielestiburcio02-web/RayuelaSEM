'use client';

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

type SecretariaSidebarProps = {
    onSelectOption: (option: 'tramites') => void;
};

export default function SecretariaSidebar({ onSelectOption }: SecretariaSidebarProps) {
  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col space-y-4 shadow-md pt-8">

      <Button variant="ghost" className="justify-start gap-2" onClick={() => onSelectOption('tramites')}>
        <FileText className="h-5 w-5" />
        <span>Trámites</span>
      </Button>
      
    </div>
  )
}
