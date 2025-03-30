import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { 
  MessageSquare, 
  User, 
  BriefcaseBusiness, 
  ArrowRight, 
  Menu, 
  Palette
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose 
} from "@/components/ui/sheet";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Only show NavBar on mobile or when not authenticated
  if (!isMobile && user) {
    return null;
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Theme toggle removed as per requirements

  const MobileMenuButton = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/10 md:hidden"
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-gradient-to-b from-teal-700 to-teal-600 text-white border-teal-700 p-0">
        <SheetHeader className="px-4 py-6 border-b border-teal-600">
          <SheetTitle className="text-white flex items-center">
            <span className="bg-white text-teal-600 px-2 py-1 rounded-md mr-2 shadow-md font-extrabold">{t('app.title').charAt(0)}</span>
            {t('app.title')}
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          <LanguageSwitcher />
          
          {user ? (
            <>
              <div className="space-y-3 mt-2">
                <SheetClose asChild>
                  <Link href="/post-service" className="block">
                    <Button 
                      variant="outline" 
                      className="w-full bg-teal-600 text-white hover:bg-teal-500 border-teal-400/50 rounded-lg font-medium"
                    >
                      {t('navigation.postService')}
                    </Button>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/post-requirement" className="block">
                    <Button 
                      variant="outline" 
                      className="w-full bg-teal-600 text-white hover:bg-teal-500 border-teal-400/50 rounded-lg font-medium"
                    >
                      {t('navigation.postRequirement')}
                    </Button>
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link href="/dashboard" className="block">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-1 bg-white/10 text-white hover:bg-white/20 border-teal-400/20 rounded-lg font-medium"
                    >
                      <BriefcaseBusiness className="h-4 w-4" />
                      {t('navigation.dashboard')}
                    </Button>
                  </Link>
                </SheetClose>
              </div>

              <div className="pt-2 border-t border-teal-600">
                <div className="grid grid-cols-4 gap-2">
                  <SheetClose asChild>
                    <Link href="/messages" className="block">
                      <Button 
                        variant="ghost" 
                        className="w-full flex flex-col items-center justify-center gap-1 text-white hover:bg-teal-500/50 rounded-lg"
                      >
                        <MessageSquare className="h-5 w-5" />
                        <span className="text-xs">{t('navigation.messages')}</span>
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/profile" className="block">
                      <Button 
                        variant="ghost" 
                        className="w-full flex flex-col items-center justify-center gap-1 text-white hover:bg-teal-500/50 rounded-lg"
                      >
                        <User className="h-5 w-5" />
                        <span className="text-xs">{t('navigation.profile')}</span>
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <NotificationsDropdown isMobile={true} />
                  </SheetClose>

                </div>
                <div className="mt-2">
                  <SheetClose asChild>
                    <Link href="/preferences" className="block">
                      <Button 
                        variant="ghost" 
                        className="w-full flex items-center justify-center gap-2 text-white hover:bg-teal-500/50 rounded-lg"
                      >
                        <Palette className="h-5 w-5" />
                        <span>{t('navigation.preferences')}</span>
                      </Button>
                    </Link>
                  </SheetClose>
                </div>
              </div>

              <SheetClose asChild>
                <Button 
                  variant="outline" 
                  onClick={() => logoutMutation.mutate()}
                  className="w-full mt-4 bg-white text-teal-600 hover:bg-teal-50 transition-all duration-300 rounded-lg font-medium flex items-center justify-center gap-1"
                >
                  {t('navigation.logout')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </SheetClose>
            </>
          ) : (
            <>
              <SheetClose asChild>
                <Link href="/auth" className="block">
                  <Button className="w-full bg-white text-teal-600 hover:bg-teal-50 shadow-md hover:shadow-lg transition-all duration-300 font-medium rounded-lg">
                    {t('navigation.login')} / {t('navigation.register')}
                  </Button>
                </Link>
              </SheetClose>
              

            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <nav className="border-b border-teal-700/10 shadow-lg bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/">
              <div className="flex items-center text-xl font-bold text-white hover:scale-105 transition-all duration-300 ease-in-out">
                <span className="bg-white text-teal-600 px-2 py-1 rounded-md mr-2 shadow-md font-extrabold">{t('app.title').charAt(0)}</span>
                {t('app.title')}
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <MobileMenuButton />
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <>
                <Link href="/post-service">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-teal-600 text-white hover:bg-teal-500 border-teal-400/50 transition-all duration-300 rounded-lg font-medium"
                  >
                    {t('navigation.postService')}
                  </Button>
                </Link>
                <Link href="/post-requirement">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-teal-600 text-white hover:bg-teal-500 border-teal-400/50 transition-all duration-300 rounded-lg font-medium"
                  >
                    {t('navigation.postRequirement')}
                  </Button>
                </Link>
                <Link href="/dashboard" className="nav-link">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-teal-400/20 transition-all duration-300 rounded-lg font-medium"
                  >
                    <BriefcaseBusiness className="h-4 w-4" />
                    {t('navigation.dashboard')}
                  </Button>
                </Link>
                <div className="flex rounded-full bg-teal-800/20 p-0.5 border border-teal-400/20">
                  <Link href="/messages">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title={t('navigation.messages')} 
                      className="text-white hover:bg-teal-500/50 rounded-full transition-all duration-300"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  </Link>
                  <NotificationsDropdown />
                  <Link href="/profile">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title={t('navigation.profile')} 
                      className="text-white hover:bg-teal-500/50 rounded-full transition-all duration-300"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/preferences">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title={t('navigation.preferences')} 
                      className="text-white hover:bg-teal-500/50 rounded-full transition-all duration-300"
                    >
                      <Palette className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  className="text-white hover:bg-teal-500/50 transition-all duration-300 rounded-lg font-medium flex items-center gap-1"
                >
                  {t('navigation.logout')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button className="bg-white text-teal-600 hover:bg-teal-50 shadow-md hover:shadow-lg transition-all duration-300 font-medium rounded-lg">
                    {t('navigation.login')} / {t('navigation.register')}
                  </Button>
                </Link>

              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
