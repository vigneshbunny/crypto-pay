import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Edit, 
  Key, 
  Bell, 
  Download, 
  HelpCircle, 
  Info, 
  LogOut 
} from "lucide-react";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, wallet, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  return (
    <div className="pb-20">
      <div className="flex items-center p-6 border-b border-gray-100">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation('/dashboard')}
          className="mr-4 p-0"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="p-6">
        {/* Profile Section */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-xl font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {user?.email?.split('@')[0] || 'User'}
                </h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {wallet?.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-6)}` : ''}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="p-0">
                <Edit className="text-primary" size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Options */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0 divide-y divide-gray-100">
              <Button 
                variant="ghost" 
                className="w-full justify-between p-4 h-auto hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Key className="text-gray-400 mr-3" size={20} />
                  <span className="font-medium text-gray-900">Security & Privacy</span>
                </div>
                <div className="text-gray-400">›</div>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-between p-4 h-auto hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Bell className="text-gray-400 mr-3" size={20} />
                  <span className="font-medium text-gray-900">Notifications</span>
                </div>
                <div className="text-gray-400">›</div>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-between p-4 h-auto hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Download className="text-gray-400 mr-3" size={20} />
                  <span className="font-medium text-gray-900">Backup Wallet</span>
                </div>
                <div className="text-gray-400">›</div>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 divide-y divide-gray-100">
              <Button 
                variant="ghost" 
                className="w-full justify-between p-4 h-auto hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <HelpCircle className="text-gray-400 mr-3" size={20} />
                  <span className="font-medium text-gray-900">Help & Support</span>
                </div>
                <div className="text-gray-400">›</div>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-between p-4 h-auto hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Info className="text-gray-400 mr-3" size={20} />
                  <span className="font-medium text-gray-900">About</span>
                </div>
                <div className="text-gray-400">›</div>
              </Button>
            </CardContent>
          </Card>

          {/* Logout */}
          <Button 
            variant="outline"
            onClick={handleLogout}
            className="w-full bg-red-50 border-red-200 text-red-600 py-4 rounded-xl font-semibold hover:bg-red-100"
          >
            <LogOut className="mr-2" size={16} />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
