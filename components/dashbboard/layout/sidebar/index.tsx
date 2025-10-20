"use client";
import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PRIVATE_ADMIN_NAV_ROUTES, PRIVATE_USER_NAV_ROUTES } from "@/lib/constants";
import Link from "next/link";
import { Route } from "next";
import { usePathname } from "next/navigation";
import { PricingUploadModal } from "../../admin/ui/PricingUploadModal";

export const Sidebar = () => {
  const { data: user } = useCurrentUser();

  const pathname = usePathname()

  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const visibleNavItems = user?.user_metadata.role === 'admin' || user?.user_metadata.role === 'super_admin' ? PRIVATE_ADMIN_NAV_ROUTES : PRIVATE_USER_NAV_ROUTES;


  useEffect(() => {
    const html = document.documentElement;
    if (isOpen) {
      html.classList.add("sidebar-open");
    } else {
      html.classList.remove("sidebar-open");
    }
  }, [isOpen]);

  const sidebarPositionClass = isOpen ? "translate-x-0" : "-translate-x-full";
  const tabVisibilityClass = isOpen ? "hidden" : "block";

  return (
    <>
      <aside
        className={`fixed inset-y-0 md:top-20 md:absolute left-0 w-64 bg-white shadow-lg flex flex-col transition-transform duration-300 ease-in-out z-50 md:h-full ${sidebarPositionClass}`}
      >
        <div className="h-20 flex items-center justify-between border-b border-gray-200 px-4">
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            <span className="text-teal-500">Clean</span>Nami
            {user?.role === "admin" && (
              <span className="block text-xs font-semibold text-gray-500 tracking-widest -mt-1">
                ADMIN
              </span>
            )}
          </h1>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-0 py-0 h-full space-y-2 bg-teal-50 ">
          <div className="p-0 bg-gray-50 rounded-lg text-sm text-gray-600">
            {visibleNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.route as Route}
                className={`flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-600 rounded-lg transition-colors duration-200 text-left ${
                  pathname === item.route
                    ? "text-teal-700"
                    : "hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      <button
        onClick={toggleSidebar}
        className={`fixed top-8 left-0 p-3 bg-teal-500 text-white rounded-r-lg shadow-md hover:bg-teal-600 transition-colors z-40 ${tabVisibilityClass}`}
        aria-label="Open sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black opacity-50 z-40 md:hidden"
          aria-hidden="true"
        ></div>
      )}
    </>
  );
};
