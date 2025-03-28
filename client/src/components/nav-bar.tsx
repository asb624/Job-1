import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { MessageSquare, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/">
              <div className="flex items-center text-xl font-bold">
                {t('app.title')}
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {user ? (
              <>
                {user.isServiceProvider ? (
                  <Link href="/post-service">
                    <Button variant="outline" size="sm">{t('navigation.postService')}</Button>
                  </Link>
                ) : (
                  <Link href="/post-requirement">
                    <Button variant="outline" size="sm">{t('navigation.postRequirement')}</Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">{t('navigation.dashboard')}</Button>
                </Link>
                <Link href="/messages">
                  <Button variant="ghost" size="icon" title={t('navigation.messages')}>
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </Link>
                <NotificationsDropdown />
                <Link href="/profile">
                  <Button variant="ghost" size="icon" title={t('navigation.profile')}>
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                >
                  {t('navigation.logout')}
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button>{t('navigation.login')} / {t('navigation.register')}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
