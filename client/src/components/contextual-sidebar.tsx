import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator
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
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

interface SidebarNavProps {
  className?: string;
}

export function ContextualSidebar({ className }: SidebarNavProps) {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
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

  // Toggle sidebar collapsed state (only for desktop)
  const toggleCollapsed = () => {
    if (!isMobile) {
      setCollapsed(!collapsed);
    }
  };

  if (isMobile) {
    return null; // Don't show sidebar on mobile, we'll keep the mobile menu in NavBar
  }

  // If not authenticated, show a simplified sidebar
  if (!user) {
    return (
      <SidebarProvider
        open={!collapsed}
        onOpenChange={(open) => setCollapsed(!open)}
        className={cn("h-screen", className)}
      >
        <Sidebar>
          <SidebarHeader>
            <Link href="/">
              <div className="flex items-center text-xl font-bold cursor-pointer">
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md mr-2 shadow-sm font-extrabold">
                  {t('app.title').charAt(0)}
                </span>
                {!collapsed && t('app.title')}
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={location === "/"}>
                  <Link href="/">
                    <div className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      <span>{t('navigation.home')}</span>
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
                      <LogOut className="h-5 w-5" />
                      <span>{t('navigation.login')}</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={toggleTheme}>
                  <div className="flex items-center gap-2">
                    {theme === "light" ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Sun className="h-5 w-5" />
                    )}
                    <span>
                      {theme === "light"
                        ? t('navigation.darkMode')
                        : t('navigation.lightMode')}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <LanguageSwitcher />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      open={!collapsed}
      onOpenChange={(open) => setCollapsed(!open)}
      className={cn("h-screen", className)}
    >
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between w-full">
            <Link href="/">
              <div className="flex items-center text-xl font-bold cursor-pointer">
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md mr-2 shadow-sm font-extrabold">
                  {t('app.title').charAt(0)}
                </span>
                {!collapsed && t('app.title')}
              </div>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleCollapsed}
              className="text-muted-foreground hover:text-foreground"
            >
              {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* User Profile Section */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-2",
            collapsed ? "justify-center" : "justify-start"
          )}>
            <Avatar className="h-10 w-10 border-2 border-border">
              <AvatarFallback className="bg-primary/10 text-primary-foreground">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-medium">{user.username}</span>
                <span className="text-xs text-muted-foreground">
                  {user.isServiceProvider
                    ? t('auth.isServiceProvider')
                    : t('common.user')}
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
                    <Home className="h-5 w-5" />
                    <span>{t('navigation.home')}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeGroup === "dashboard"}>
                <Link href="/dashboard">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>{t('navigation.dashboard')}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeGroup === "messages"}>
                <Link href="/messages">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>{t('navigation.messages')}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarSeparator />

          {/* Contextual Navigation Groups */}
          <SidebarMenu>
            {/* Services Section - Available to all users */}
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeGroup === "post" && location.includes("service")}>
                <div className="flex items-center gap-2">
                  <PenBox className="h-5 w-5" />
                  <span>{t('services.title')}</span>
                </div>
              </SidebarMenuButton>
              <SidebarMenuSub>
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
              </SidebarMenuSub>
            </SidebarMenuItem>

            {/* Requirements Section - Available to all users */}
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeGroup === "post" && location.includes("requirement")}>
                <div className="flex items-center gap-2">
                  <PenBox className="h-5 w-5" />
                  <span>{t('requirements.title')}</span>
                </div>
              </SidebarMenuButton>
              <SidebarMenuSub>
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
                  <User className="h-5 w-5" />
                  <span>{t('profile.title')}</span>
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
                  <LogOut className="h-5 w-5" />
                  <span>{t('navigation.logout')}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleTheme}>
                <div className="flex items-center gap-2">
                  {theme === "light" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                  <span>
                    {theme === "light"
                      ? t('navigation.darkMode')
                      : t('navigation.lightMode')}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <LanguageSwitcher />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}