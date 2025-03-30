import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  SidebarProvider,
  useSidebar
} from "@/components/ui/sidebar";
import {
  Home,
  LayoutDashboard,
  MessageSquare,
  User,
  Briefcase,
  LogOut,
  PenBox,
  Palette,
  Sun,
  Moon,
  FileText,
  ChevronsLeft,
  ChevronsRight,
  CirclePlus,
  Globe,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

interface SidebarNavProps {
  className?: string;
}

// Content wrapper that adjusts margin based on sidebar state
export function MainContent({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { collapsed } = useSidebar();
  
  const marginLeft = 
    isMobile ? "ml-0" : 
    collapsed ? "ml-16" : "ml-64";

  return (
    <main
      className={cn(
        "transition-all duration-300 ease-in-out min-h-screen",
        marginLeft
      )}
    >
      {children}
    </main>
  );
}

// Sidebar layout wrapper that provides the context
export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();

  return (
    <SidebarProvider
      open={!collapsed}
      onOpenChange={(open) => setCollapsed(!open)}
      className="h-screen"
    >
      {children}
    </SidebarProvider>
  );
}

export function ContextualSidebar({ className }: SidebarNavProps) {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Determine which contextual group should be active based on current route
  useEffect(() => {
    if (location === "/") {
      setActiveGroup("home");
    } else if (location.startsWith("/dashboard")) {
      setActiveGroup("dashboard");
    } else if (location.startsWith("/messages")) {
      setActiveGroup("messages");
    } else if (location.startsWith("/post")) {
      setActiveGroup("post");
    } else if (location.startsWith("/profile") || location.startsWith("/preferences")) {
      setActiveGroup("user");
    } else {
      setActiveGroup(null);
    }
  }, [location]);

  // For mobile devices, don't show the sidebar
  if (isMobile) {
    return null; // Don't show sidebar on mobile, we'll keep the mobile menu in NavBar
  }

  // Get sidebar state from the parent SidebarProvider
  const { collapsed: providerCollapsed, toggleCollapsed: toggleProviderCollapsed } = useSidebar();
  
  // Use the parent provider's state
  const isCollapsed = providerCollapsed;

  // If not authenticated, show a simplified sidebar
  if (!user) {
    return (
      <Sidebar>
        <SidebarHeader>
          <Link href="/">
            <div className="flex items-center text-xl font-bold cursor-pointer">
              <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md mr-2 shadow-sm font-extrabold">
                {t('app.title').charAt(0)}
              </span>
              {!isCollapsed && t('app.title')}
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={location === "/"}>
                <Link href="/">
                  <div className="flex items-center gap-2">
                    <Home className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                    {!isCollapsed && <span className="animate-in fade-in duration-300">{t('navigation.home')}</span>}
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Link href="/auth">
                  <div className="flex items-center gap-2">
                    <LogOut className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                    {!isCollapsed && <span className="animate-in fade-in duration-300">{t('navigation.login')}</span>}
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleTheme}>
                <div className="flex items-center gap-2">
                  {theme === "light" ? (
                    <Moon className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                  ) : (
                    <Sun className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                  )}
                  {!isCollapsed && (
                    <span className="animate-in fade-in duration-300">
                      {theme === "light"
                        ? t('navigation.darkMode')
                        : t('navigation.lightMode')}
                    </span>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              {isCollapsed ? (
                <SidebarMenuButton>
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 mx-auto" />
                  </div>
                </SidebarMenuButton>
              ) : (
                <div className="px-3 py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-5 w-5" />
                    <span className="animate-in fade-in duration-300">{t('language.select')}</span>
                  </div>
                  <LanguageSwitcher />
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between w-full">
          <Link href="/">
            <div className="flex items-center text-xl font-bold cursor-pointer">
              <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md mr-2 shadow-sm font-extrabold">
                {t('app.title').charAt(0)}
              </span>
              {!isCollapsed && t('app.title')}
            </div>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleProviderCollapsed}
            className="text-muted-foreground hover:text-foreground transition-all duration-300 ease-in-out
              hover:bg-primary/5 hover:shadow-sm"
          >
            {isCollapsed ? 
              <ChevronsRight className="h-5 w-5 animate-in slide-in-from-left duration-300" /> : 
              <ChevronsLeft className="h-5 w-5 animate-in slide-in-from-right duration-300" />
            }
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* User Profile Section */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-2",
          isCollapsed ? "justify-center" : "justify-start"
        )}>
          <Avatar className="h-10 w-10 border-2 border-border">
            <AvatarFallback className="bg-primary/10 text-primary-foreground">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-medium">{user.username}</span>
              <span className="text-xs text-muted-foreground">
                {t('common.user')}
              </span>
            </div>
          )}
        </div>

        <SidebarSeparator />

        {/* Main Navigation */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={activeGroup === "home"}>
              <Link href="/">
                <div className="flex items-center gap-2">
                  <Home className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                  {!isCollapsed && <span className="animate-in fade-in duration-300">{t('navigation.home')}</span>}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton isActive={activeGroup === "dashboard"}>
              <Link href="/dashboard">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                  {!isCollapsed && <span className="animate-in fade-in duration-300">{t('navigation.dashboard')}</span>}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton isActive={activeGroup === "messages"}>
              <Link href="/messages">
                <div className="flex items-center gap-2">
                  <MessageSquare className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                  {!isCollapsed && <span className="animate-in fade-in duration-300">{t('navigation.messages')}</span>}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />

        {/* Contextual Navigation Groups */}
        <SidebarMenu>
          {/* Service & Requirements Options - Available to all users */}
          <SidebarMenuItem>
            <SidebarMenuButton isActive={activeGroup === "post"}>
              <div className="flex items-center gap-2">
                <PenBox className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                {!isCollapsed && <span className="animate-in fade-in duration-300">{t('navigation.marketplace')}</span>}
              </div>
            </SidebarMenuButton>
            <SidebarMenuSub>
              {/* Service options */}
              <SidebarMenuSubItem>
                <SidebarMenuSubButton isActive={location === "/post-service"}>
                  <Link href="/post-service">
                    <div className="flex items-center gap-2">
                      <CirclePlus className="h-4 w-4" />
                      <span>{t('navigation.postService')}</span>
                    </div>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <Link href="/dashboard?filter=services">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>{t('services.manageServices')}</span>
                    </div>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <Link href="/dashboard?filter=bids">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{t('services.manageBids')}</span>
                    </div>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              
              {/* Requirement options */}
              <SidebarMenuSubItem>
                <SidebarMenuSubButton isActive={location === "/post-requirement"}>
                  <Link href="/post-requirement">
                    <div className="flex items-center gap-2">
                      <CirclePlus className="h-4 w-4" />
                      <span>{t('navigation.postRequirement')}</span>
                    </div>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <Link href="/dashboard?filter=requirements">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{t('requirements.manageRequirements')}</span>
                    </div>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>

          {/* User Account Group */}
          <SidebarMenuItem>
            <SidebarMenuButton isActive={activeGroup === "user"}>
              <div className="flex items-center gap-2">
                <User className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                {!isCollapsed && <span className="animate-in fade-in duration-300">{t('profile.title')}</span>}
              </div>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton isActive={location === "/profile"}>
                  <Link href="/profile">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{t('navigation.profile')}</span>
                    </div>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton isActive={location === "/preferences"}>
                  <Link href="/preferences">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      <span>{t('navigation.preferences')}</span>
                    </div>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => logoutMutation.mutate()}>
              <div className="flex items-center gap-2">
                <LogOut className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                {!isCollapsed && <span className="animate-in fade-in duration-300">{t('navigation.logout')}</span>}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme}>
              <div className="flex items-center gap-2">
                {theme === "light" ? (
                  <Moon className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                ) : (
                  <Sun className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                )}
                {!isCollapsed && (
                  <span className="animate-in fade-in duration-300">
                    {theme === "light"
                      ? t('navigation.darkMode')
                      : t('navigation.lightMode')}
                  </span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {isCollapsed ? (
              <SidebarMenuButton>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 mx-auto" />
                </div>
              </SidebarMenuButton>
            ) : (
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5" />
                  <span className="animate-in fade-in duration-300">{t('language.select')}</span>
                </div>
                <LanguageSwitcher />
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}