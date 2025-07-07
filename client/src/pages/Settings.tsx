import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
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
  LogOut, 
  User, 
  Shield 
} from "lucide-react";
import { ShimmerSkeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogOverlay } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { wallet, walletLoading } = useWallet(user?.id || 0);
  const { toast } = useToast();

  // State for private key dialog
  const [showDialog, setShowDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // State for change password dialog
  const [showPwdDialog, setShowPwdDialog] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleLogout = () => {
    logout();
    localStorage.clear();
    sessionStorage.clear();
    // Force redirect to login page
    window.location.href = '/login';
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const handleGetPrivateKey = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    setPrivateKey("");
    try {
      const res = await axios.post(`/api/wallet/${user.id}/private-key`, { password });
      setPrivateKey(res.data.privateKey);
      setShowKey(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch private key");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    setPwdError("");
    setPwdSuccess("");
    setPwdLoading(true);
    if (newPwd !== confirmPwd) {
      setPwdError("Passwords do not match");
      setPwdLoading(false);
      return;
    }
    try {
      await axios.post(`/api/user/${user.id}/change-password`, {
        currentPassword: currentPwd,
        newPassword: newPwd
      });
      setPwdSuccess("Password changed successfully");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err: any) {
      setPwdError(err.response?.data?.message || "Failed to change password");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* User Profile */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                {walletLoading ? (
                  <div className="space-y-2">
                    <ShimmerSkeleton className="h-5 w-32" />
                    <ShimmerSkeleton className="h-4 w-48" />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user?.email || 'User'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Wallet: {wallet ? formatAddress(wallet.address) : 'Loading...'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Options */}
        <div className="space-y-4">
          {/* Security */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Security</h3>
              </div>
              <div className="divide-y divide-gray-100">
                <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setShowPwdDialog(true)}>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Change Password</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  disabled>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Two-Factor Authentication</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDialog(true)}>
                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Get Private Key</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
              </div>
              <div className="divide-y divide-gray-100">
                <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Transaction Alerts</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Price Alerts</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Support</h3>
              </div>
              <div className="divide-y divide-gray-100">
                <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <HelpCircle className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Help Center</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Info className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">About</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <Card>
          <CardContent className="p-6">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* Network Info */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Network Configuration</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Network</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Mainnet
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">API Endpoint</span>
                <span className="text-sm text-gray-500 font-mono">api.trongrid.io</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">USDT Contract</span>
                <span className="text-sm text-gray-500 font-mono">TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-gray-900">Crypto Wallet</h3>
              <p className="text-sm text-gray-600">Version 1.0.0</p>
              <p className="text-xs text-gray-500">
                Built with React, TypeScript, and TRON Network
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Private Key Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) {
          setPassword("");
          setPrivateKey("");
          setError("");
          setShowKey(false);
        }
      }}>
        <DialogOverlay style={{ background: 'rgba(0,0,0,0.3)' }} />
        <DialogContent className="bg-white shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Export Private Key</DialogTitle>
            <DialogDescription>
              For your security, enter your account password to reveal your private key. Never share your private key with anyone.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleGetPrivateKey(); }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              className="mb-2"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleGetPrivateKey(); } }}
            />
            <Button onClick={handleGetPrivateKey} disabled={loading || !password || !user} className="w-full" type="submit">
              {loading ? "Checking..." : "Reveal Private Key"}
            </Button>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {privateKey && (
              <div className="bg-white rounded p-3 mt-2 relative shadow border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-2 absolute right-2 top-2 z-10">
                  <Button size="sm" variant="ghost" type="button" aria-label="Toggle private key visibility" onClick={e => { e.preventDefault(); setShowKey(v => !v); }}>
                    {showKey ? "Hide" : "Show"}
                  </Button>
                  <Button size="sm" variant="outline" type="button" aria-label="Copy private key" onClick={e => { e.preventDefault(); navigator.clipboard.writeText(privateKey); setCopied(true); setTimeout(() => setCopied(false), 1000); }}>
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="font-mono break-all text-gray-800 mt-10">
                  {showKey ? privateKey : "••••••••••••••••••••••••••••••••"}
                </div>
              </div>
            )}
          </form>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPwdDialog} onOpenChange={(open) => {
        setShowPwdDialog(open);
        if (!open) {
          setCurrentPwd("");
          setNewPwd("");
          setConfirmPwd("");
          setPwdError("");
          setPwdSuccess("");
        }
      }}>
        <DialogOverlay style={{ background: 'rgba(0,0,0,0.3)' }} />
        <DialogContent className="bg-white shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password to update your account.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleChangePassword(); }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <Input
              type="password"
              placeholder="Current password"
              value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)}
              disabled={pwdLoading}
              autoFocus
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <Input
              type="password"
              placeholder="New password"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              disabled={pwdLoading}
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              disabled={pwdLoading}
            />
            <Button type="submit" disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd || !user} className="w-full">
              {pwdLoading ? "Updating..." : "Change Password"}
            </Button>
            {pwdError && <div className="text-red-500 text-sm">{pwdError}</div>}
            {pwdSuccess && <div className="text-green-600 text-sm">{pwdSuccess}</div>}
          </form>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
