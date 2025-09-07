import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Zone, Ticket } from "../../Interfaces/interfaces";
import { motion } from "framer-motion";
import axios from "axios";
import { useState } from "react";
import TicketModal from "../TicketModal/TicketModal";
import { toast } from "react-toastify";
import { useAppSelector } from "../../hooks/hooks";
import type { RootState } from "../../Store/Store";

export default function ZoneCard({
  zone,
  activeTab,
  gateId,
  verifiedSubscription,
}: {
  zone: Zone;
  activeTab: "visitor" | "subscriber";
  gateId: string;
  verifiedSubscription: any;
}) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { userToken } = useAppSelector((store: RootState) => store.userReducer);

  const checkinMutation = useMutation({
    mutationFn: async (payload: { gateId: string; zoneId: string; type: string; subscriptionId?: string }) => {
      const res = await axios.post(
        "http://localhost:3000/api/v1/tickets/checkin",
        payload,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );
      return res.data;
    },
    onSuccess: (data) => {
      setTicket(data.ticket);
      setIsModalOpen(true);
      queryClient.invalidateQueries(["zones", gateId]); // Rely on server data
    },
    onError: (err: any) => {
      const message =
        err.response?.status === 409
          ? "Zone is full or unavailable."
          : err.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
    },
  });

  const handleEnterZone = () => {
    if (!userToken) {
      toast.warning("Please login first to enter a zone.");
      return;
    }

    if (activeTab === "subscriber" && !verifiedSubscription) {
      toast.error("Please verify your subscription before checking in.");
      return;
    }

    if (activeTab === "subscriber" && verifiedSubscription.categoryId !== zone.categoryId) {
      toast.error("Subscription not valid for this zone's category.");
      return;
    }

    const payload: any = { gateId, zoneId: zone.id, type: activeTab };
    if (activeTab === "subscriber") payload.subscriptionId = verifiedSubscription.id;
    checkinMutation.mutate(payload);
  };

  const isDisabled =
    !zone.open ||
    (activeTab === "visitor" && zone.availableForVisitors <= 0) ||
    (activeTab === "subscriber" && (!verifiedSubscription || verifiedSubscription.categoryId !== zone.categoryId));

  return (
    <>
      <motion.div
        key={zone.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-md border border-gray-200 p-6 flex flex-col transition-all"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-400/20 to-pink-400/20 opacity-0 hover:opacity-100 blur-xl transition duration-500 -z-10" />

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{zone.name}</h2>
          <div className="flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                zone.open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {zone.open ? "Open" : "Closed"}
            </span>
            {zone.specialActive && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                Special Rate
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Category: <span className="font-medium">{zone.category}</span>
        </p>

        <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
          <span className="font-medium">Occupied:</span> <span>{zone.occupied}</span>
          <span className="font-medium">Free:</span> <span>{zone.free}</span>
          <span className="font-medium">Reserved:</span> <span>{zone.reserved}</span>
          <span className="font-medium">Visitors Avail:</span> <span>{zone.availableForVisitors}</span>
          <span className="font-medium">Subscribers Avail:</span> <span>{zone.availableForSubscribers}</span>
          <span className="font-medium">Normal Rate:</span> <span>${zone.rateNormal.toFixed(2)}</span>
          <span className="font-medium">Special Rate:</span> <span>${zone.rateSpecial.toFixed(2)}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isDisabled}
          onClick={handleEnterZone}
          className="mt-6 w-full px-4 py-2.5 rounded-lg font-semibold text-sm shadow transition-colors bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Enter Zone
        </motion.button>
      </motion.div>

      <TicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} ticket={ticket} />
    </>
  );
}