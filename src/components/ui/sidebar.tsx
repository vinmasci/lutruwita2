import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Route, Mountain, Layers } from 'lucide-react';

const Sidebar = () => {
  return (
    <Sheet defaultOpen>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Map Controls</SheetTitle>
        </SheetHeader>
        
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Route className="mr-2 h-4 w-4" />
              Route Toggle
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Mountain className="mr-2 h-4 w-4" />
              Gradient Toggle
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Layers className="mr-2 h-4 w-4" />
              Surface Toggle
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;