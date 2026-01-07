"use client";

import { cn } from "@/lib/utils";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, type ReactNode } from "react";

type NavLinkProps = Omit<LinkProps, "href"> & {
  href: string;
  className?: string;
  activeClassName?: string;
  children?: ReactNode;
};

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ href, className, activeClassName, children, ...props }, ref) => {
    const pathname = usePathname();

    // active exact match
    const isActive = pathname === href;

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
