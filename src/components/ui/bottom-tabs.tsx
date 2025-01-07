import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Search, Plus, Route, Navigation, Settings } from 'lucide-react';

const BottomTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.substring(1) || 'home';

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'home':
        navigate('/');
        break;
      case 'explore':
        navigate('/explore');
        break;
      case 'create':
        navigate('/create');
        break;
      // Add other routes as needed
    }
  };

  return (
    <div className="bg-white border-t">
      <Tabs value={currentPath} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="home" className="flex-1">
            <Home className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger value="explore" className="flex-1">
            <Search className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger value="create" className="flex-1">
            <Plus className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex-1">
            <Route className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger value="navigate" className="flex-1">
            <Navigation className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">
            <Settings className="h-5 w-5" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default BottomTabs;