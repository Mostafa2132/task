// src/pages/AdminDashboard.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../Components/Loading/Loading";
import type { Employee, Zone } from "../../Interfaces/interfaces";

// ---------------- Types ----------------

type Category = {
  id: string;
  name: string;
  rateNormal: number;
  rateSpecial: number;
};

type RushHour = { id: string; weekDay: number; from: string; to: string };
type Vacation = { id: string; name: string; from: string; to: string };
type AuditLog = { ts: string; action: string; admin: string };

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
      {message}
    </div>
  );
}

// ---------------- Main ----------------
export default function AdminDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "zones"
    | "categories"
    | "employees"
    | "rush"
    | "vacations"
    | "subscriptions"
  >("overview");
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const queryClient = useQueryClient();

  const axiosAuth = axios.create({
    baseURL: "http://localhost:3000/api/v1",
    headers: { Authorization: `Bearer ${token}` },
  });

  // ---------------- Load token from localStorage ----------------
  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const logout = () => {
    setToken(null);
    localStorage.removeItem("adminToken");
    toast.info("Logged out ✅");
  };
  // ---------------- WebSocket ----------------
  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket("ws://localhost:3000/api/v1/ws/admin");
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === "admin-update") {
        setAuditLog((prev) => [
          {
            ts: new Date().toLocaleTimeString(),
            action: msg.action,
            admin: msg.adminId,
          },
          ...prev,
        ]);
        queryClient.invalidateQueries();
      }
    };
    return () => ws.close();
  }, [token]);

  // ---------------- Login ----------------
  async function handleLogin(username: string, password: string) {
    try {
      const res = await axios.post("http://localhost:3000/api/v1/auth/login", {
        username,
        password,
      });
      setToken(res.data.token);
      localStorage.setItem("adminToken", res.data.token); // 🟢 حفظ التوكن
      toast.success("Login successful ✅");
    } catch {
      toast.error("Login failed ❌");
    }
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            handleLogin(
              fd.get("username") as string,
              fd.get("password") as string
            );
          }}
          className="bg-white shadow p-6 rounded-xl space-y-3"
        >
          <h2 className="text-xl font-bold mb-2">Admin Login</h2>
          <input
            name="username"
            placeholder="Username"
            className="w-full border p-2 rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full border p-2 rounded"
          />
          <button className="w-full py-2 bg-indigo-600 text-white rounded-lg">
            Login
          </button>
        </form>
      </div>
    );
  }

  // ---------------- Overview Tab ----------------
  function OverviewTab() {
    const { data: zones } = useQuery({
      queryKey: ["zones"],
      queryFn: async () =>
        (await axiosAuth.get("/admin/reports/parking-state")).data,
    });
    const { data: employees } = useQuery({
      queryKey: ["employees"],
      queryFn: async () => (await axiosAuth.get("/admin/users")).data,
    });
    const { data: subs } = useQuery({
      queryKey: ["subscriptions"],
      queryFn: async () => (await axiosAuth.get("/admin/subscriptions")).data,
    });

    const openZones = zones?.filter((z: Zone) => z.open).length || 0;
    const closedZones = zones?.filter((z: Zone) => !z.open).length || 0;
    const activeSubs = subs?.filter((s: any) => s.active).length || 0;
    const inactiveSubs = subs?.filter((s: any) => !s.active).length || 0;

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <h4 className="text-gray-500">Employees</h4>
          <p className="text-2xl font-bold">{employees?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <h4 className="text-gray-500">Zones Open</h4>
          <p className="text-2xl font-bold text-green-600">{openZones}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <h4 className="text-gray-500">Zones Closed</h4>
          <p className="text-2xl font-bold text-red-600">{closedZones}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <h4 className="text-gray-500">Active Subs</h4>
          <p className="text-2xl font-bold text-indigo-600">{activeSubs}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <h4 className="text-gray-500">Inactive Subs</h4>
          <p className="text-2xl font-bold text-gray-600">{inactiveSubs}</p>
        </div>
      </div>
    );
  }

  // ---------------- Zones Tab ----------------

  function ZonesTab() {
    const queryClient = useQueryClient();

    // 🟢 Get zones report (admin)
    const {
      data: zones,
      isLoading,
      error,
    } = useQuery({
      queryKey: ["zonesReport"],
      queryFn: async () => {
        const res = await axiosAuth.get("/admin/reports/parking-state");
        return res.data;
      },
    });

    // 🟢 Toggle open/close zone
    const toggleZone = useMutation({
      mutationFn: async ({ id, open }: { id: string; open: boolean }) =>
        axiosAuth.put(`/admin/zones/${id}/open`, { open }),
      onSuccess: () => queryClient.invalidateQueries(["zonesReport"]),
    });

    if (isLoading) return <Loading />;
    if (error) return <ErrorBox message="Failed to load zones" />;

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Zones</h2>

        {/* 🟢 Zones List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones?.map((z: Zone) => (
            <div
              key={z.zoneId}
              className="bg-white rounded-2xl shadow p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{z.name}</h3>
                  <p className="text-sm text-gray-500">{z.category ?? "N/A"}</p>
                </div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm ${
                    z.open
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {z.open ? "Open" : "Closed"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-sm text-gray-700">
                <div>Total: {z.totalSlots ?? 0}</div>
                <div>Occupied: {z.occupied ?? 0}</div>
                <div>Free: {z.free ?? 0}</div>
                <div>Reserved: {z.reserved ?? 0}</div>
              </div>

              <div className="mt-4">
                <button
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  onClick={() =>
                    toggleZone.mutate({
                      id: z.zoneId ?? "",
                      open: !(z.open ?? false),
                    })
                  }
                >
                  {z.open ? "Close Zone" : "Open Zone"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // ---------------- Categories Tab ----------------
  function CategoriesTab() {
    const { data, isLoading } = useQuery({
      queryKey: ["categories"],
      queryFn: async () => (await axiosAuth.get("/master/categories")).data,
    });

    const updateRate = useMutation({
      mutationFn: async (cat: Category) =>
        axiosAuth.put(`/admin/categories/${cat.id}`, {
          rateNormal: cat.rateNormal,
          rateSpecial: cat.rateSpecial,
        }),
      onSuccess: () => queryClient.invalidateQueries(["categories"]),
    });

    if (isLoading) return <Loading />;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((c: Category) => (
          <div
            key={c.id}
            className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
          >
            <h3 className="font-bold text-indigo-700">{c.name}</h3>
            <div className="mt-3 space-y-2">
              <label className="block text-sm text-gray-600">
                Normal Rate
                <input
                  type="number"
                  defaultValue={c.rateNormal}
                  onBlur={(e) =>
                    updateRate.mutate({ ...c, rateNormal: +e.target.value })
                  }
                  className="border p-2 rounded w-full mt-1"
                />
              </label>
              <label className="block text-sm text-gray-600">
                Special Rate
                <input
                  type="number"
                  defaultValue={c.rateSpecial}
                  onBlur={(e) =>
                    updateRate.mutate({ ...c, rateSpecial: +e.target.value })
                  }
                  className="border p-2 rounded w-full mt-1"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ---------------- Employees Tab ----------------

  function EmployeesTab() {
    const queryClient = useQueryClient();
    const [editId, setEditId] = useState<string | null>(null);
    const [formValues, setFormValues] = useState({
      name: "",
      username: "",
      role: "employee",
    });

    // 1️⃣ جلب الموظفين
    const { data, isLoading } = useQuery<Employee[]>({
      queryKey: ["employees"],
      queryFn: async () => {
        const res = await axios.get("/api/v1/admin/users");
        // تحقق من مكان array الموظفين في الاستجابة
        return Array.isArray(res.data) ? res.data : res.data.data || [];
      },
    });

    const employees = Array.isArray(data) ? data : [];

    // 2️⃣ إضافة موظف جديد
    const createEmp = useMutation({
      mutationFn: async (emp: Omit<Employee, "id">) =>
        axios.post("/api/v1/admin/users", emp),
      onSuccess: (res) => {
        queryClient.setQueryData<Employee[]>(["employees"], (old = []) => [
          ...old,
          res.data,
        ]);
      },
    });

    // 3️⃣ تعديل موظف
    const updateEmp = useMutation({
      mutationFn: async (emp: Employee) =>
        axios.put(`/api/v1/admin/users/${emp.id}`, emp),
      onSuccess: (res) => {
        queryClient.setQueryData<Employee[]>(["employees"], (old = []) =>
          old.map((e) => (e.id === res.data.id ? res.data : e))
        );
        setEditId(null);
        setFormValues({ name: "", username: "", role: "employee" });
      },
    });

    // 4️⃣ حذف موظف
    const deleteEmp = useMutation({
      mutationFn: async (id: string) =>
        axios.delete(`/api/v1/admin/users/${id}`),
      onSuccess: (_, id) => {
        queryClient.setQueryData<Employee[]>(["employees"], (old = []) =>
          old.filter((e) => e.id !== id)
        );
      },
    });

    // 5️⃣ تعبئة الفورم عند الضغط على Edit
    useEffect(() => {
      if (editId) {
        const emp = employees.find((e) => e.id === editId);
        if (emp)
          setFormValues({
            name: emp.name,
            username: emp.username,
            role: emp.role,
          });
      }
    }, [editId, employees]);

    if (isLoading) return <p>Loading...</p>;

    return (
      <div>
        {/* فورم إضافة / تعديل */}
        <form
          className="mb-4 flex flex-wrap gap-2 bg-white p-4 rounded-lg shadow"
          onSubmit={(e) => {
            e.preventDefault();
            const empData = {
              name: formValues.name,
              username: formValues.username,
              role: formValues.role as "employee" | "admin",
            };

            if (editId) {
              updateEmp.mutate({ id: editId, ...empData });
            } else {
              createEmp.mutate(empData);
            }

            setFormValues({ name: "", username: "", role: "employee" });
          }}
        >
          <input
            name="name"
            placeholder="Name"
            className="border p-2 rounded flex-1"
            value={formValues.name}
            onChange={(e) =>
              setFormValues({ ...formValues, name: e.target.value })
            }
          />
          <input
            name="username"
            placeholder="Username"
            className="border p-2 rounded flex-1"
            value={formValues.username}
            onChange={(e) =>
              setFormValues({ ...formValues, username: e.target.value })
            }
          />
          <select
            name="role"
            className="border p-2 rounded"
            value={formValues.role}
            onChange={(e) =>
              setFormValues({ ...formValues, role: e.target.value })
            }
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
          <button className="bg-indigo-600 text-white px-4 rounded">
            {editId ? "Update" : "Add"}
          </button>
        </form>

        {/* قائمة الموظفين */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-lg shadow p-4 flex flex-col gap-1 hover:shadow-lg transition"
            >
              <h3 className="font-bold text-indigo-700">{e.name}</h3>
              <p className="text-gray-600 text-sm">@{e.username}</p>
              <span
                className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${
                  e.role === "admin"
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {e.role}
              </span>

              <div className="mt-2 flex gap-2">
                <button
                  className="text-sm px-2 py-1 bg-yellow-200 rounded hover:bg-yellow-300"
                  onClick={() => setEditId(e.id)}
                >
                  Edit
                </button>
                <button
                  className="text-sm px-2 py-1 bg-red-200 rounded hover:bg-red-300"
                  onClick={() => deleteEmp.mutate(e.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------- Rush Hours Tab ----------------
  function RushTab() {
    const { data, isLoading } = useQuery({
      queryKey: ["rush"],
      queryFn: async () => (await axiosAuth.get("/admin/rush-hours")).data,
    });

    const addRush = useMutation({
      mutationFn: async (r: { weekDay: number; from: string; to: string }) =>
        axiosAuth.post("/admin/rush-hours", r),
      onSuccess: () => queryClient.invalidateQueries(["rush"]),
    });

    if (isLoading) return <Loading />;

    return (
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            addRush.mutate({
              weekDay: Number(fd.get("weekDay")),
              from: fd.get("from") as string,
              to: fd.get("to") as string,
            });
          }}
          className="flex gap-2 mb-3"
        >
          <select name="weekDay" className="border p-1 rounded">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
          <input type="time" name="from" className="border p-1 rounded" />
          <input type="time" name="to" className="border p-1 rounded" />
          <button className="bg-indigo-600 text-white px-3 rounded">Add</button>
        </form>
        <ul>
          {data.map((r: RushHour) => (
            <li key={r.id} className="bg-white p-2 rounded shadow">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][r.weekDay]}{" "}
              {r.from} - {r.to}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ---------------- Vacations Tab ----------------

  function VacationsTab() {
    const { data, isLoading } = useQuery({
      queryKey: ["vacations"],
      queryFn: async () => {
        const res = await axiosAuth.get("/admin/vacations");

        // نتأكد إننا دايمًا نرجع مصفوفة
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.vacations))
          return res.data.vacations;

        return []; // fallback لو مفيش data
      },
    });

    if (isLoading) return <Loading />;

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data || []).map((v: Vacation) => (
          <div
            key={v.id}
            className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 className="font-bold text-lg">{v.name}</h3>
            <p className="text-sm text-gray-600">
              From: {v.from} - To: {v.to}
            </p>

            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              Active
            </span>
          </div>
        ))}
      </div>
    );
  }
  // ---------------- Subscriptions Tab ----------------
  function SubscriptionsTab() {
    const { data, isLoading } = useQuery({
      queryKey: ["subscriptions"],
      queryFn: async () => (await axiosAuth.get("/admin/subscriptions")).data,
    });

    if (isLoading) return <Loading />;

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((s: any) => (
          <div
            key={s.id}
            className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 className="font-bold text-lg">{s.userName}</h3>
            <p className="text-sm text-gray-600">Category: {s.category}</p>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                s.active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {s.active ? "Active" : "Inactive"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ---------------- Render ----------------
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white p-6 shadow flex flex-col">
        <h1 className="text-2xl font-bold text-indigo-600 mb-6">Admin Panel</h1>
        {[
          "overview",
          "zones",
          "categories",
          "employees",
          "rush",
          "vacations",
          "subscriptions",
        ].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={`w-full text-left px-4 py-2 rounded ${
              activeTab === t ? "bg-indigo-600 text-white" : "hover:bg-gray-100"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div className="mt-auto">
          <h2 className="font-semibold mb-2">Audit Log</h2>
          <ul className="space-y-1 max-h-40 overflow-y-auto text-sm">
            {auditLog.map((a, i) => (
              <li key={i} className="text-gray-600">
                <span className="font-medium">{a.admin}</span> {a.action} at{" "}
                {a.ts}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={logout}
          className="bg-indigo-600 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "zones" && <ZonesTab />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "employees" && <EmployeesTab />}
        {activeTab === "rush" && <RushTab />}
        {activeTab === "vacations" && <VacationsTab />}
        {activeTab === "subscriptions" && <SubscriptionsTab />}
      </main>
    </div>
  );
}
