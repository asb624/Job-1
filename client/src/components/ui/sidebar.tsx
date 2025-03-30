import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

type SidebarContextType = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const SidebarProvider = ({ 
  children, 
  defaultCollapsed = false,
  open,
  onOpenChange,
  className
}: SidebarProviderProps) => {
  const [_collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const collapsed = open !== undefined ? !open : _collapsed;
  
  const toggleCollapsed = React.useCallback(() => {
    if (onOpenChange) {
      onOpenChange(!collapsed);
    } else {
      setCollapsed(!collapsed);
    }
  }, [collapsed, onOpenChange]);

  const value = React.useMemo(() => ({
    collapsed,
    toggleCollapsed
  }), [collapsed, toggleCollapsed]);

  return (
    <SidebarContext.Provider value={value}>
      <div className={cn("flex", className)}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

const Sidebar = ({ children, className }: SidebarProps) => {
  const { collapsed } = useSidebar();
  const width = collapsed ? "w-16" : "w-64";

  return (
    <div 
      className={cn(
        "h-screen shrink-0 border-r border-border bg-background transition-all duration-300 ease-in-out",
        width,
        className
      )}
    >
      {children}
    </div>
  );
};

interface SidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const SidebarHeader = ({ children, className }: SidebarHeaderProps) => {
  return (
    <div className={cn("flex h-14 items-center px-4", className)}>
      {children}
    </div>
  );
};

interface SidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

const SidebarContent = ({ children, className }: SidebarContentProps) => {
  return (
    <div className={cn("flex-1 overflow-auto px-2", className)}>
      {children}
    </div>
  );
};

interface SidebarFooterProps {
  children: React.ReactNode;
  className?: string;
}

const SidebarFooter = ({ children, className }: SidebarFooterProps) => {
  return (
    <div className={cn("px-2 py-2", className)}>
      {children}
    </div>
  );
};

const SidebarSeparator = () => {
  return <Separator className="my-2" />;
};

interface SidebarMenuProps {
  children: React.ReactNode;
  className?: string;
}

const SidebarMenu = ({ children, className }: SidebarMenuProps) => {
  return (
    <div className={cn("flex flex-col gap-1 py-2", className)}>
      {children}
    </div>
  );
};

interface SidebarMenuItemProps {
  children: React.ReactNode;
  className?: string;
}

const SidebarMenuItem = ({ children, className }: SidebarMenuItemProps) => {
  return (
    <div className={cn("flex", className)}>
      {children}
    </div>
  );
};

interface SidebarMenuButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  asChild?: boolean;
  className?: string;
}

const SidebarMenuButton = ({ children, onClick, isActive, className }: SidebarMenuButtonProps) => {
  return (
    <Button 
      variant={isActive ? "secondary" : "ghost"} 
      onClick={onClick}
      className={cn(
        "w-full justify-start", 
        className
      )}
    >
      {children}
    </Button>
  );
};

interface SidebarMenuSubProps {
  children: React.ReactNode;
  className?: string;
}

const SidebarMenuSub = ({ children, className }: SidebarMenuSubProps) => {
  const { collapsed } = useSidebar();
  
  if (collapsed) {
    return null;
  }
  
  return (
    <div className={cn("ml-6 flex flex-col gap-1", className)}>
      {children}
    </div>
  );
};

interface SidebarMenuSubItemProps {
  children: React.ReactNode;
  className?: string;
}

const SidebarMenuSubItem = ({ children, className }: SidebarMenuSubItemProps) => {
  return (
    <div className={cn("flex", className)}>
      {children}
    </div>
  );
};

interface SidebarMenuSubButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  asChild?: boolean;
  className?: string;
}

const SidebarMenuSubButton = ({ children, onClick, isActive, className }: SidebarMenuSubButtonProps) => {
  return (
    <Button 
      variant={isActive ? "secondary" : "ghost"} 
      size="sm"
      onClick={onClick}
      className={cn(
        "w-full justify-start", 
        className
      )}
    >
      {children}
    </Button>
  );
};

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar
};