// app/(admin)/admin/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: userRole, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  // This is a placeholder. You need a proper way to assign roles.
  // For now, we'll deny access if there's no explicit 'admin' role.
  if (error || !userRole || userRole.role !== "admin") {
    return redirect("/dashboard"); // Or a dedicated "unauthorized" page
  }

  return user;
}

export default async function AdminDashboardPage() {
  const user = await checkAdmin();

  const supabase = await createClient();
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    return <p>Error fetching users: {usersError.message}</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="text-3xl">{users.users.length}</p>
        </div>
        {/* Add more stats widgets here */}
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <ul>
            {users.users.map((user) => (
              <li key={user.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p>{user.email}</p>
                  <p className="text-sm text-gray-500">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
                {/* Add manage/delete buttons here */}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
