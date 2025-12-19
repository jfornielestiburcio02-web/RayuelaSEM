'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Check } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';


const medidasContrarias = [
    { id: 'perturbar', label: 'Perturbar o impedir la realización o el desarrollo.' },
    { id: 'dificultar', label: 'Impedir o dificultar el trabajo.' },
    { id: 'mal_uso', label: 'Mal uso del material.' },
    { id: 'actuaciones_incorrectas', label: 'Actuaciones Incorrectas hacia algún miembro.' },
];

const medidasGraves = [
    { id: 'injurias', label: 'Injurias u ofensas.' },
    { id: 'agresion', label: 'Agresión física.' },
    { id: 'estupefacientes', label: 'Consumo de estupefacientes.' },
];

const correcciones = [
    'Amonestacion oral',
    'Apercibimiento por escrito',
    'Suspender el derecho de asisstir de 1 a 3 días',
];


const formSchema = z.object({
  incidente: z.string().min(1, "El incidente es obligatorio."),
  descripcion: z.string().min(1, "La descripción es obligatoria."),
  instructorId: z.string().min(1, "Debes seleccionar un instructor."),
  fecha: z.date({ required_error: 'La fecha es obligatoria.' }),
  tipoMedida: z.enum(['Contrarias', 'Graves'], { required_error: 'Debes seleccionar un tipo de medida.' }),
  medidas: z.array(z.string()).optional(),
  medidaOtro: z.string().optional(),
  aplicaCorreccion: z.enum(['si', 'no'], { required_error: 'Debes indicar si se aplica corrección.' }),
  tipoCorreccion: z.string().optional(),
  correccionOtro: z.string().optional(),
}).refine(data => {
    if (data.aplicaCorreccion === 'si') {
        return data.tipoCorreccion && data.tipoCorreccion.length > 0;
    }
    return true;
}, {
    message: 'Debes seleccionar un tipo de corrección.',
    path: ['tipoCorreccion'],
});

type ConductaFormValues = z.infer<typeof formSchema>;

type UserDoc = {
  id: string;
  username: string;
};

type RegistroConductaFormProps = {
  user: UserDoc;
  onFinished: () => void;
};

export default function RegistroConductaForm({ user, onFinished }: RegistroConductaFormProps) {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const { toast } = useToast();

    const instructorsQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'users'), where('role', 'array-contains', 'Instructor')) : null,
      [firestore]
    );
    const { data: instructors, isLoading: isLoadingInstructors } = useCollection<UserDoc>(instructorsQuery);

    const form = useForm<ConductaFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            incidente: '',
            descripcion: '',
            instructorId: '',
            fecha: new Date(),
            medidas: [],
            medidaOtro: '',
            aplicaCorreccion: 'no',
            tipoCorreccion: '',
            correccionOtro: '',
        }
    });

    const onSubmit = async (values: ConductaFormValues) => {
        if (!firestore || !currentUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar a la base de datos.' });
            return;
        }
        
        const instructorSeleccionado = instructors?.find(i => i.id === values.instructorId);

        try {
            await addDoc(collection(firestore, 'conductas'), {
                ...values,
                fecha: format(values.fecha, 'yyyy-MM-dd'),
                alumnoId: user.id,
                alumnoName: user.username,
                instructorName: instructorSeleccionado?.username || 'N/A',
                creadoEn: serverTimestamp(),
            });

            toast({
                title: 'Registro de Conducta Creado',
                description: `Se ha guardado el registro para ${user.username}.`,
            });
            onFinished();

        } catch (error) {
            console.error("Error al crear registro:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el registro.' });
        }
    };
    
    const tipoMedida = form.watch('tipoMedida');
    const aplicaCorreccion = form.watch('aplicaCorreccion');
    const tipoCorreccion = form.watch('tipoCorreccion');

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto pr-4">
                <h3 className="text-lg font-semibold border-b pb-2">Conductas desarrolladas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="incidente" render={({ field }) => (
                        <FormItem><FormLabel>Incidente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="instructorId" render={({ field }) => (
                        <FormItem><FormLabel>Profesional que comunica</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingInstructors}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un instructor..." /></SelectTrigger></FormControl>
                            <SelectContent>{instructors?.map(i => <SelectItem key={i.id} value={i.id}>{i.username}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="fecha" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel><Popover>
                            <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? (format(field.value, "PPP", { locale: es })) : (<span>Selecciona una fecha</span>)}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="descripcion" render={({ field }) => (
                    <FormItem><FormLabel>Descripción detallada</FormLabel><FormControl><Textarea className='min-h-[100px]' {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <h3 className="text-lg font-semibold border-b pb-2 pt-4">Medidas</h3>
                <FormField control={form.control} name="tipoMedida" render={({ field }) => (
                    <FormItem><FormLabel>Tipo de medidas</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo..." /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Contrarias">Contrarias</SelectItem><SelectItem value="Graves">Graves</SelectItem></SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                
                {tipoMedida && (
                    <FormField control={form.control} name="medidas" render={() => (
                        <FormItem>
                            <div className="space-y-2">
                                {(tipoMedida === 'Contrarias' ? medidasContrarias : medidasGraves).map((item) => (
                                    <FormField key={item.id} control={form.control} name="medidas" render={({ field }) => (
                                        <FormItem key={item.id} className="flex items-center space-x-2 space-y-0">
                                            <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                                return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))
                                            }} /></FormControl>
                                            <FormLabel className="font-normal text-sm">{item.label}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                                <div className="flex items-center gap-2">
                                     <FormField control={form.control} name="medidas" render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><Checkbox checked={field.value?.includes('otro')} onCheckedChange={(checked) => {
                                                return checked ? field.onChange([...(field.value || []), 'otro']) : field.onChange(field.value?.filter((value) => value !== 'otro'))
                                            }} /></FormControl>
                                             <FormLabel className="font-normal text-sm">Otro:</FormLabel>
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name="medidaOtro" render={({ field }) => (
                                        <FormItem className='flex-grow'><FormControl><Input {...field} disabled={!form.watch('medidas')?.includes('otro')} /></FormControl></FormItem>
                                    )} />
                                </div>
                            </div>
                        </FormItem>
                    )} />
                )}

                <h3 className="text-lg font-semibold border-b pb-2 pt-4">Correcciones aplicadas</h3>
                 <FormField control={form.control} name="aplicaCorreccion" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>¿Se aplica corrección?</FormLabel><FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="si" /></FormControl><FormLabel className="font-normal">Sí</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                        </RadioGroup>
                    </FormControl><FormMessage /></FormItem>
                )} />

                {aplicaCorreccion === 'si' && (
                    <>
                        <FormField control={form.control} name="tipoCorreccion" render={({ field }) => (
                             <FormItem><FormLabel>Tipo de medida</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una corrección..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {correcciones.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    <SelectItem value="Otros">Otros</SelectItem>
                                </SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                        {tipoCorreccion === 'Otros' && (
                            <FormField control={form.control} name="correccionOtro" render={({ field }) => (
                                <FormItem><FormLabel>Especificar otra corrección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        )}
                    </>
                )}


                <div className='flex justify-end gap-2 pt-4'>
                    <Button type="button" variant="outline" onClick={onFinished}>Cancelar</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Registro'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
