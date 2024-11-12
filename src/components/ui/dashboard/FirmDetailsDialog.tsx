// src/components/dashboard/FirmDetailsDialog.tsx
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { MapPin, Phone, Mail, Printer, Building2 } from 'lucide-react';
  
  interface FirmData {
    id: string;
    name: string;
    address: string;
    phone: string;
    fax?: string;
    email: string;
    type: string;
    state: string;
    city: string;
  }
  
  interface FirmDetailsDialogProps {
    firm: FirmData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }
  
  export function FirmDetailsDialog({ firm, open, onOpenChange }: FirmDetailsDialogProps) {
    if (!firm) return null;
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{firm.name}</DialogTitle>
            <DialogDescription>{firm.id}</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 mt-1" />
                <div>
                  <div className="font-medium">Type</div>
                  <div>{firm.type}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1" />
                <div>
                  <div className="font-medium">Address</div>
                  <div>{firm.address}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-1" />
                <div>
                  <div className="font-medium">Phone</div>
                  <a href={`tel:${firm.phone}`} className="hover:underline">
                    {firm.phone}
                  </a>
                </div>
              </div>
              
              {firm.fax && (
                <div className="flex items-start gap-2">
                  <Printer className="h-4 w-4 mt-1" />
                  <div>
                    <div className="font-medium">Fax</div>
                    <div>{firm.fax}</div>
                  </div>
                </div>
              )}
              
              {firm.email && (
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-1" />
                  <div>
                    <div className="font-medium">Email</div>
                    <a href={`mailto:${firm.email}`} className="text-primary hover:underline">
                      {firm.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
  
            <div className="mt-4">
              <div className="font-medium mb-2">Location</div>
              <iframe
                width="100%"
                height="300"
                frameBorder="0"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(firm.address)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                className="rounded-lg"
              ></iframe>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }