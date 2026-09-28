import AdminHeader from "@/src/components/admin/AdminHeader";
import "./AdminLayout.css";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="admin-shell">
      <AdminHeader />
      {children}
    </div>
  );
}
