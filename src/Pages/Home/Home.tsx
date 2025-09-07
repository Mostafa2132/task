import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import Loading from "../../Components/Loading/Loading";
import type { Gate } from "../../Interfaces/interfaces";

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["gates"],
    queryFn: async () => {
      const res = await axios.get("http://localhost:3000/api/v1/master/gates");
      console.log(res.data);

      return res.data;
    },
  });
  if (isLoading) return <Loading />;

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-20">
        <h1 className="text-4xl font-bold mb-4">Welcome to Parking System</h1>
        <p className="text-lg opacity-90">
          Smart parking reservations system for visitors & subscribers
        </p>
        <button className="mt-6 px-6 py-3 bg-white text-indigo-600 rounded-xl shadow hover:shadow-lg">
          Get Started
        </button>
      </section>

      {/* Features Section */}
      <section className="px-6 text-center">
        <h2 className="text-2xl font-bold mb-8">Why Choose Us?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white shadow p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-2">Fast Access</h3>
            <p className="text-gray-600">Instant reservations at any gate.</p>
          </div>
          <div className="bg-white shadow p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-2">Secure</h3>
            <p className="text-gray-600">
              Reliable & safe system for everyone.
            </p>
          </div>
          <div className="bg-white shadow p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-2">24/7 Availability</h3>
            <p className="text-gray-600">Access gates anytime, anywhere.</p>
          </div>
        </div>
      </section>

      {/* Gates Section */}
      <section className="px-6">
        <h2 className="text-2xl font-bold mb-6">Available Gates</h2>

        {isLoading && <Loading />}
        {error && <p className="text-red-500">Error loading gates</p>}

        <div className="grid md:grid-cols-3 gap-4">
          {data?.map((gate: Gate) => (
            <Link
              to={`/gate/${gate.id}?name=${gate.name}`}
              key={gate.id}
              className="bg-white shadow rounded-xl p-4 hover:shadow-lg transition flex flex-col"
            >
              <h3 className="text-lg font-bold">{gate.name}</h3>
              <p className="text-gray-500">{gate.description}</p>
              <span className="mt-2 text-sm text-indigo-600">
                View details →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-6 text-gray-500">
        © {new Date().getFullYear()} Parking Reservations System
      </footer>
    </div>
  );
}
