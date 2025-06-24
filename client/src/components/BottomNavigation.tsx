import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, History, QrCode, User } from "lucide-react";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/scan', icon: QrCode, label: 'Scan' },
    { path: '/settings', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path === '/dashboard' && location === '/');
          const Icon = item.icon;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center py-3 px-4 h-auto ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-primary'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
