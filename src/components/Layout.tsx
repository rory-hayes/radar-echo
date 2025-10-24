import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Home,
  Phone,
  FileText,
  Settings,
  Layers,
  Mic,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/store/use-ui';
import { Avatar, AvatarFallback } from './ui/avatar';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Phone, label: 'Calls', path: '/calls' },
    { icon: Layers, label: 'Frameworks', path: '/frameworks' },
    { icon: FileText, label: 'Integrations', path: '/integrations' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Top Bar */}
      <header className="h-16 border-b border-border bg-white sticky top-0 z-40 flex items-center px-6">
        <div className="flex items-center gap-4 flex-1">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-subtext hover:text-primary">
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && <span className="text-xl font-bold text-primary tracking-wide">ECHO</span>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-subtext" />
            <Input placeholder="Search... (⌘K)" className="pl-10 bg-white border-border" />
          </div>
          <Avatar className="w-9 h-9 cursor-pointer">
            <AvatarFallback className="bg-accent text-accent-foreground">SC</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 80 : 240 }}
          transition={{ duration: 0.2 }}
          className="border-r border-border bg-white flex flex-col"
        >
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`w-full justify-start gap-3 ${
                    active
                      ? 'bg-accent text-white hover:bg-accent/90'
                      : 'text-subtext hover:text-primary hover:bg-muted'
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </Button>
              );
            })}
          </nav>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
