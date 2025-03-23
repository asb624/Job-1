import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { MessageSquare, User } from "lucide-react";

export function NavBar() {
  const { user, logoutMutation } = useAuth();

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/">
              <div className="flex items-center text-xl font-bold">
                ServiceMarket
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.isServiceProvider ? (
                  <Link href="/post-service">
                    <Button variant="outline" size="sm">Post Service</Button>
                  </Link>
                ) : (
                  <Link href="/post-requirement">
                    <Button variant="outline" size="sm">Post Requirement</Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
                <Link href="/messages">
                  <Button variant="ghost" size="icon">
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </Link>
                <NotificationsDropdown />
                <Link href="/profile">
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button>Login / Register</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
