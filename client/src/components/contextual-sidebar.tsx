import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

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
  FileText,
  ChevronsLeft,
  ChevronsRight,
  CirclePlus,
  Settings,
  Heart,
  Bell,
  Search,
  Calendar,
  Zap,
  Bookmark,
  Clock,
  Award
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface SidebarNavProps {
  className?: string;
}

export function ContextualSidebar({ className }: SidebarNavProps) {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
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
      <TooltipProvider delayDuration={300}>
        <SidebarProvider
          open={!collapsed}
          onOpenChange={(open) => setCollapsed(!open)}
          className={cn("h-screen", className)}
        >
          <Sidebar className="border-r shadow-sm">
            <SidebarHeader className="py-2">
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
              <SidebarMenu>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={location === "/"}>
                          <Link href="/">
                            <div className="flex items-center justify-center">
                              <Home className="h-5 w-5" />
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right">{t('navigation.home')}</TooltipContent>
                  </Tooltip>
                ) : (
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
                )}
                
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <Link href="/auth">
                            <div className="flex items-center justify-center">
                              <LogOut className="h-5 w-5" />
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right">{t('navigation.login')}</TooltipContent>
                  </Tooltip>
                ) : (
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
                )}
              </SidebarMenu>
            </SidebarContent>

            <SidebarFooter>
              <SidebarMenu>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <LanguageSwitcher collapsed={true} />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">{t('language.select')}</TooltipContent>
                  </Tooltip>
                ) : (
                  <SidebarMenuItem>
                    <LanguageSwitcher collapsed={false} />
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
        </SidebarProvider>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <SidebarProvider
        open={!collapsed}
        onOpenChange={(open) => setCollapsed(!open)}
        className={cn("h-screen", className)}
      >
        <Sidebar className="border-r shadow-sm">
          <SidebarHeader className="py-2">
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
              "flex items-center gap-3 px-4 py-3 mb-2 hover:bg-accent/50 rounded-md transition-colors",
              collapsed ? "justify-center" : "justify-start"
            )}>
              <Link href="/profile">
                <Avatar className="h-10 w-10 border-2 border-primary/20 cursor-pointer">
                  <AvatarFallback className="bg-primary/10 text-primary-foreground">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              {!collapsed && (
                <div className="flex flex-col">
                  <Link href="/profile">
                    <span className="font-medium hover:text-primary transition-colors">{user.username}</span>
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {t('common.user')}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {!collapsed && (
              <div className="grid grid-cols-2 gap-1 px-2 mb-3">
                <Button variant="outline" size="sm" className="flex items-center gap-1 h-9" asChild>
                  <Link href="/post-service">
                    <CirclePlus className="h-4 w-4" /> {t('navigation.post')}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1 h-9">
                  <Search className="h-4 w-4" /> {t('navigation.search')}
                </Button>
              </div>
            )}

            <SidebarSeparator />

            {/* Main Navigation */}
            <div className="mb-1 px-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {collapsed ? "" : t('navigation.main')}
              </p>
            </div>
            <SidebarMenu>
              {/* Home */}
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={activeGroup === "home"}>
                        <Link href="/">
                          <div className="flex items-center justify-center">
                            <Home className="h-5 w-5" />
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">{t('navigation.home')}</TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeGroup === "home"}>
                    <Link href="/">
                      <div className="flex items-center gap-3">
                        <Home className="h-5 w-5" />
                        <span>{t('navigation.home')}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Dashboard */}
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={activeGroup === "dashboard"}>
                        <Link href="/dashboard">
                          <div className="flex items-center justify-center">
                            <LayoutDashboard className="h-5 w-5" />
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">{t('navigation.dashboard')}</TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeGroup === "dashboard"}>
                    <Link href="/dashboard">
                      <div className="flex items-center gap-3">
                        <LayoutDashboard className="h-5 w-5" />
                        <span>{t('navigation.dashboard')}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Messages */}
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={activeGroup === "messages"}>
                        <Link href="/messages">
                          <div className="flex items-center justify-center">
                            <MessageSquare className="h-5 w-5" />
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">{t('navigation.messages')}</TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeGroup === "messages"}>
                    <Link href="/messages">
                      <div className="flex items-center gap-3 justify-between w-full">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-5 w-5" />
                          <span>{t('navigation.messages')}</span>
                        </div>
                        <Badge variant="secondary" className="ml-auto text-xs">3</Badge>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>

            <SidebarSeparator className="my-3" />

            {/* Marketplace Section */}
            <div className="mb-1 px-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {collapsed ? "" : t('navigation.marketplace')}
              </p>
            </div>

            {/* Contextual Navigation Groups */}
            <SidebarMenu>
              {/* Services Section */}
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={activeGroup === "post" && location.includes("service")}>
                        <div className="flex items-center justify-center">
                          <Briefcase className="h-5 w-5" />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">{t('services.title')}</TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeGroup === "post" && location.includes("service")}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5" />
                        <span>{t('services.title')}</span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={location === "/post-service"}>
                        <Link href="/post-service">
                          <div className="flex items-start gap-2">
                            <CirclePlus className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{t('navigation.postService')}</span>
                          </div>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton>
                        <Link href="/dashboard?filter=services">
                          <div className="flex items-start gap-2">
                            <Briefcase className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">Manage Services</span>
                          </div>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton>
                        <Link href="/dashboard?filter=bids">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">Manage Bids</span>
                          </div>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              )}

              {/* Requirements Section */}
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={activeGroup === "post" && location.includes("requirement")}>
                        <div className="flex items-center justify-center">
                          <FileText className="h-5 w-5" />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">{t('requirements.title')}</TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeGroup === "post" && location.includes("requirement")}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5" />
                        <span>{t('requirements.title')}</span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={location === "/post-requirement"}>
                        <Link href="/post-requirement">
                          <div className="flex items-start gap-2">
                            <CirclePlus className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{t('navigation.postRequirement')}</span>
                          </div>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton>
                        <Link href="/dashboard?filter=requirements">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">Manage Requirements</span>
                          </div>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              )}

              {/* Saved Items */}
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <div className="flex items-center justify-center">
                          <Bookmark className="h-5 w-5" />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">{t('navigation.saved')}</TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Bookmark className="h-5 w-5" />
                        <span>{t('navigation.saved')}</span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>

            <SidebarSeparator className="my-3" />

            {/* Settings Section */}
            <div className="mb-1 px-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {collapsed ? "" : t('navigation.settings')}
              </p>
            </div>

            <SidebarMenu>
              {/* Account Settings */}
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={activeGroup === "user"}>
                        <div className="flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">{t('profile.title')}</TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeGroup === "user"}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5" />
                        <span>{t('profile.title')}</span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={location === "/profile"}>
                        <Link href="/profile">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{t('navigation.profile')}</span>
                          </div>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={location === "/preferences"}>
                        <Link href="/preferences">
                          <div className="flex items-start gap-2">
                            <Palette className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{t('navigation.preferences')}</span>
                          </div>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t pt-3">
            <SidebarMenu>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => logoutMutation.mutate()}>
                        <div className="flex items-center justify-center">
                          <LogOut className="h-5 w-5" />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">{t('navigation.logout')}</TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => logoutMutation.mutate()}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <LogOut className="h-5 w-5" />
                        <span>{t('navigation.logout')}</span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <LanguageSwitcher collapsed={true} />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">{t('language.select')}</TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuItem>
                  <LanguageSwitcher collapsed={false} />
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </TooltipProvider>
  );
}