import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { MessageSquare, User, BriefcaseBusiness, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();

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

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <>
                {user.isServiceProvider ? (
                  <Link href="/post-service">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-teal-600 text-white hover:bg-teal-500 border-teal-400/50 transition-all duration-300 rounded-lg font-medium"
                    >
                      {t('navigation.postService')}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/post-requirement">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-teal-600 text-white hover:bg-teal-500 border-teal-400/50 transition-all duration-300 rounded-lg font-medium"
                    >
                      {t('navigation.postRequirement')}
                    </Button>
                  </Link>
                )}
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
              <Link href="/auth">
                <Button className="bg-white text-teal-600 hover:bg-teal-50 shadow-md hover:shadow-lg transition-all duration-300 font-medium rounded-lg">
                  {t('navigation.login')} / {t('navigation.register')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
