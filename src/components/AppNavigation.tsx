import type { ReactNode } from "react";

type AppNavigationProps = {
  currentPage: "dashboard" | "admin";
  canManage?: boolean;
  onOpenAdmin?: () => void;
  onBack?: () => void;
};

type NavigationItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  active: boolean;
  icon: ReactNode;
};

function NavIcon({ name }: { name: "overview" | "checks" | "admin" | "back" }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    checks: <><path d="M8 4h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" /><path d="M8 4v4H3M9 13h8M9 17h8" /></>,
    admin: <><path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6z" /><path d="m9 12 2 2 4-4" /></>,
    back: <><path d="M19 12H5M12 19l-7-7 7-7" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function AppNavigation({ currentPage, canManage = false, onOpenAdmin, onBack }: AppNavigationProps) {
  const items: NavigationItem[] = currentPage === "admin"
    ? [
        { label: "مدیریت کاربران", active: true, icon: <NavIcon name="admin" /> },
        { label: "بازگشت به چک‌ها", active: false, onClick: onBack, icon: <NavIcon name="back" /> },
      ]
    : [
        { label: "نمای کلی", href: "#overview", active: false, icon: <NavIcon name="overview" /> },
        { label: "چک‌های دریافتی", href: "#checks", active: false, icon: <NavIcon name="checks" /> },
        ...(canManage ? [{ label: "پنل مدیریت", active: false, onClick: onOpenAdmin, icon: <NavIcon name="admin" /> }] : []),
      ];

  const renderItem = (item: NavigationItem, mobile = false) => {
    const className = `app-nav-item ${item.active ? "is-active" : ""} ${mobile ? "app-nav-item-mobile" : ""}`;
    const content = <>{item.icon}<span>{item.label}</span></>;
    if (item.href) return <a key={item.label} href={item.href} className={className}>{content}</a>;
    return <button key={item.label} type="button" onClick={item.onClick} className={className}>{content}</button>;
  };

  return (
    <>
      <aside className="app-sidebar" aria-label="ناوبری اصلی">
        <a href="#overview" className="app-sidebar-brand">
          <span className="app-brand-mark">چ</span>
          <span><strong>CheckReminder</strong><small>مدیریت هوشمند چک‌ها</small></span>
        </a>
        <p className="app-nav-caption">فضای کاری</p>
        <nav className="app-sidebar-links">
          {items.map((item) => renderItem(item))}
        </nav>
        <div className="app-sidebar-footer">مدیریت مالی، ساده‌تر</div>
      </aside>
      <nav className="app-mobile-nav" aria-label="ناوبری موبایل">
        {items.map((item) => renderItem(item, true))}
      </nav>
    </>
  );
}
