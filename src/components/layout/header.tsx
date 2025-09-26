"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Search, PlusCircle, Heart, LogOut, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

const navigation = [
  {
    name: "Generate",
    href: "/generate",
    icon: PlusCircle,
    description: "Create AI anime profile pictures",
  },
  {
    name: "Explore",
    href: "/explore",
    icon: Search,
    description: "Browse community creations",
  },
  {
    name: "Liked",
    href: "/liked",
    icon: Heart,
    description: "Your favorite images",
    requiresAuth: true,
  },
];

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm"
          : "bg-transparent",
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container flex h-16 items-center justify-between mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-4 group">
          <motion.div
            className="flex items-center justify-center"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image
              src="/favicon-32x32.png"
              alt="ppoi logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded"
            />
          </motion.div>
          <span className="font-bold text-2xl bg-gradient-to-r from-brand-primary via-brand-magenta to-brand-cyan bg-clip-text text-transparent">
            ppoi
          </span>
        </Link>

        {/* Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navigation
              .filter((item) => !item.requiresAuth || !!session?.user)
              .map((item) => (
                <NavigationMenuItem key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-brand-primary/10 hover:text-brand-primary focus:bg-brand-primary/10 focus:text-brand-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-brand-primary/10 data-[state=open]:bg-brand-primary/10 relative",
                        pathname === item.href &&
                          "bg-brand-primary/10 text-brand-primary",
                      )}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                      {pathname === item.href && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </motion.header>
  );
}

function UserMenu() {
  const { data: session, status } = useSession();

  // Loading state
  if (status === "loading") {
    return (
      <div
        className="h-9 w-9 animate-pulse rounded-full bg-muted"
        aria-hidden
      />
    );
  }

  // Signed out state
  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/auth/signin">
          <Button variant="outline" size="sm">
            Sign in
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button
            size="sm"
            className="bg-gradient-to-r from-brand-primary to-brand-magenta text-white shadow-glow"
          >
            Sign up
          </Button>
        </Link>
      </div>
    );
  }

  // Signed in state
  const initials = (session.user.name || session.user.email || "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center justify-center rounded-full border border-border/60 h-9 w-9 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50">
          <Avatar className="h-9 w-9">
            {session.user.image ? (
              <AvatarImage
                src={session.user.image}
                alt={session.user.name || "User"}
              />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate font-medium">
            {session.user.name || "User"}
          </span>
          {session.user.email && (
            <span className="truncate text-xs text-muted-foreground">
              {session.user.email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={`/u/${session.user.handle || session.user.name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "profile"}`}
            className="flex items-center"
          >
            <Avatar className="mr-2 h-4 w-4">
              {session.user.image ? (
                <AvatarImage
                  src={session.user.image}
                  alt={session.user.name || "User"}
                />
              ) : (
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              )}
            </Avatar>
            <span>My Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/generate" className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Generate</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/liked" className="flex items-center">
            <Heart className="mr-2 h-4 w-4" />
            <span>Liked</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
