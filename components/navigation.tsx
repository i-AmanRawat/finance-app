"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMedia } from "react-use";

import NavButton from "@/components/nav-button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const routes = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
  { href: "/accounts", label: "Accounts" },
  { href: "/categories", label: "Categories" },
  { href: "/settings", label: "Settings" },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const router = useRouter();
  const pathName = usePathname();
  const isMoblie = useMedia("(max-width: 1024px)", false); //for mobile view

  const onClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  //seperate view for moble users
  if (isMoblie) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger>
          <Button
            variant="outline"
            size="sm"
            className="font-normal bg-white/10 hover:bg-white/20 hover:text-white border-none focus-visible:ring-offset-0 focus-visible:ring-transparent outline-none text-white focus:bg-white/30 transition"
          >
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="px-2">
          <nav className="flex flex-col gap-y-2 pt-6">
            {routes.map((route) => (
              <Button
                key={route.href}
                variant={route.href === pathName ? "secondary" : "ghost"}
                onClick={() => {
                  onClick(route.href);
                }}
                className="w-full justify-start"
              >
                {route.label}
              </Button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <nav className="hidden lg:flex gap-x-2 items-center overflow-x-auto mr-auto">
      {routes.map((route, i) => (
        <NavButton
          key={i + 1}
          href={route.href}
          label={route.label}
          isActive={route.href === pathName}
        />
      ))}
    </nav>
  );
}
