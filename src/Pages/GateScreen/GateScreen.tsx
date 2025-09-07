import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState, useEffect } from "react";
import type { Zone } from "../../Interfaces/interfaces";
import Loading from "../../Components/Loading/Loading";
import ZoneCard from "../../Components/ZoneCard/ZoneCard";
import TicketModal from "../../Components/TicketModal/TicketModal";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

export default function GateScreen() {
  const { gateId } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"visitor" | "subscriber">("visitor");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [verifiedSubscription, setVerifiedSubscription] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wsStatus, setWsStatus] = useState<"Connected" | "Disconnected" | "Connecting">("Connecting");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch zones by gateId
  const {
    data: zones,
    isLoading,
    error,
    refetch: refetchZones,
  } = useQuery({
    queryKey: ["zones", gateId],
    queryFn: async () => {
      const res = await axios.get(
        `http://localhost:3000/api/v1/master/zones?gateId=${gateId}`
      );
      console.log("Zones API Response:", res.data); // Debug
      return res.data;
    },
  });

  // WebSocket connection
  useEffect(() => {
    if (!gateId) return; // Ensure gateId is defined

    const ws = new WebSocket("ws://localhost:3000");
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", payload: { gateId } }));
      setWsStatus("Connected");
    };
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "zone-update") {
        queryClient.setQueryData(["zones", gateId], (old: Zone[] | undefined) =>
          old?.map((z) => (z.id === message.payload.id ? { ...z, ...message.payload } : z))
        );
      }
      if (message.type === "admin-update") {
        queryClient.refetchQueries(["zones", gateId]); // Use queryClient.refetchQueries
      }
    };
    ws.onclose = () => setWsStatus("Disconnected");
    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setWsStatus("Disconnected");
    };
    return () => ws.close();
  }, [gateId, queryClient]); // Remove refetchZones from dependencies

  // Verify subscription
  const verifySubscription = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/v1/subscriptions/${subscriptionId}`
      );
      const subscription = res.data;
      if (!subscription.active) {
        toast.error("Subscription is inactive or expired!");
        return;
      }
      setVerifiedSubscription(subscription);
      toast.success("Subscription verified! You can now check-in.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Subscription not found or invalid.");
    }
  };

  // Check-in mutation
  const checkinMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post(
        "http://localhost:3000/api/v1/tickets/checkin",
        payload
      );
      return res.data;
    },
    onSuccess: (data) => {
      setSelectedTicket(data.ticket);
      setIsModalOpen(true);
      refetchZones();
    },
    onError: (err: any) => {
      const message =
        err.response?.status === 409
          ? "Zone is full or unavailable."
          : err.response?.data?.message || "Check-in failed";
      toast.error(message);
    },
  });

  const handleCheckin = (zoneId: string) => {
    if (activeTab === "subscriber") {
      if (!verifiedSubscription) {
        toast.error("Please verify your subscription before checking in.");
        return;
      }
      const selectedZone = zones.find((z: Zone) => z.id === zoneId);
      if (verifiedSubscription.categoryId !== selectedZone.categoryId) {
        toast.error("Subscription not valid for this zone's category.");
        return;
      }
    }
    const payload: any = { gateId, zoneId, type: activeTab };
    if (activeTab === "subscriber") payload.subscriptionId = verifiedSubscription.id;
    checkinMutation.mutate(payload);
  };

  if (isLoading) return <Loading />;

  const tabs = [
    { id: "visitor", label: "Visitor" },
    { id: "subscriber", label: "Subscriber" },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center bg-white/80 backdrop-blur-lg border border-gray-200 p-5 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold text-gray-800">
          Gate{" "}
          <span className="text-indigo-600">{searchParams.get("name") || "Unknown"}</span>
        </h1>
        <div className="flex items-center gap-4">
          <span
            className={`text-sm px-4 py-1.5 rounded-full shadow ${
              wsStatus === "Connected"
                ? "bg-green-500/90 text-white"
                : wsStatus === "Connecting"
                ? "bg-yellow-500/90 text-white"
                : "bg-red-500/90 text-white"
            }`}
          >
            {wsStatus === "Connected"
              ? "✅ WS Connected"
              : wsStatus === "Connecting"
              ? "⏳ WS Connecting"
              : "❌ WS Disconnected"}
          </span>
          <span className="text-gray-600 font-medium">{currentTime}</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="relative flex gap-2 bg-gray-100 p-2 rounded-xl w-fit shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "visitor" | "subscriber")}
            className={`relative z-10 px-5 py-2 font-semibold rounded-lg transition-colors duration-300 ${
              activeTab === tab.id
                ? "text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-indigo-600 rounded-lg shadow"
                transition={{ type: "spring", duration: 0.4 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Subscriber Verification */}
      {activeTab === "subscriber" && (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter Subscription ID"
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            className="border p-2 rounded-lg flex-1"
          />
          <button
            onClick={verifySubscription}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
          >
            Verify
          </button>
        </div>
      )}

      {/* Zones Grid */}
      {error && (
        <p className="text-red-500 text-center font-medium">
          ⚠ {error.message || "Error loading zones"}
        </p>
      )}
      {zones?.length === 0 ? (
        <p className="text-gray-500 text-center">No zones available for this gate.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {zones?.map((zone: Zone) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <ZoneCard
                zone={zone}
                gateId={gateId as string}
                activeTab={activeTab}
                verifiedSubscription={verifiedSubscription}
                onCheckin={() => handleCheckin(zone.id)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Ticket Modal */}
      {selectedTicket && (
        <TicketModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ticket={selectedTicket}
        />
      )}

      {/* Gate-Open Animation */}
      {selectedTicket && isModalOpen && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 h-20 bg-green-500 text-white flex items-center justify-center"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ duration: 0.5 }}
        >
          Gate Opening...
        </motion.div>
      )}
    </div>
  );
}