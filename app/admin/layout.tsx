import AdminHeader from "@/src/components/admin/AdminHeader";
import "./AdminLayout.css";
import AccesoPorRol from "@/src/components/auth/AccesoPorRol";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AccesoPorRol rol="admin"><div className="admin-shell">
      <AdminHeader />
      {children}
    </div></AccesoPorRol>
  );
}
