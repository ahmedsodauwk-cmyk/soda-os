import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

interface AppShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <main className="flex min-h-screen bg-background">
      <Sidebar />

      <section className="flex flex-1 flex-col overflow-y-auto">
        <Header title={title} subtitle={subtitle} />

        <div className="soda-page-enter mx-auto w-full max-w-[1600px] p-5 sm:p-6 lg:p-7">
          {children}
        </div>
      </section>
    </main>
  );
}
