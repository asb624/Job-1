import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function NavBar() {
  const { user, logoutMutation } = useAuth();

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/">
              <a className="flex items-center text-xl font-bold">
                ServiceMarket
              </a>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {user.isServiceProvider ? (
                  <Link href="/post-service">
                    <Button variant="outline">Post Service</Button>
                  </Link>
                ) : (
                  <Link href="/post-requirement">
                    <Button variant="outline">Post Requirement</Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
                <Button 
                  variant="ghost" 
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
