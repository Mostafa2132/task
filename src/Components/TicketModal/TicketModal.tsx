import type { Ticket } from "../../Interfaces/interfaces";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 👈 لو بتستخدم react-router

export default function TicketModal({
  isOpen,
  onClose,
  ticket,
}: {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
}) {
  const [ticketData, setTicketData] = useState<Ticket | null>(ticket);
  const navigate = useNavigate(); // 👈 علشان تقدر تنقله

  useEffect(() => {
    if (ticket) setTicketData(ticket);
  }, [ticket]);

  const handleGoToCheckout = () => {
    if (!ticketData) return;

    toast.info("You need the ticket ID for checkout. Redirecting…", {
      autoClose: 2000,
    });

    setTimeout(() => {
      // 👇 غير الرابط دا حسب صفحة الـ Checkout عندك
      navigate(`/checkpoint?ticketId=${ticketData.id}`);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && ticketData && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center"
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🎟️ Ticket Details
              </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-3 overflow-y-auto flex-1">
              <InfoRow label="Ticket ID" value={ticketData?.id ?? "N/A"} />
              <InfoRow label="Zone" value={ticketData?.zoneId ?? "N/A"} />
              <InfoRow label="Gate" value={ticketData?.gateId ?? "N/A"} />
              <InfoRow label="Type" value={ticketData?.type ?? "N/A"} />
              <InfoRow
                label="Check-in"
                value={
                  ticketData?.checkinAt
                    ? new Date(ticketData.checkinAt).toLocaleString()
                    : "N/A"
                }
              />

              {ticketData.checkoutAt && (
                <>
                  <InfoRow
                    label="Checkout"
                    value={new Date(ticketData.checkoutAt).toLocaleString()}
                  />
                  <InfoRow
                    label="Duration"
                    value={`${(ticketData.durationHours * 60).toFixed(1)} min`}
                  />
                  <InfoRow
                    label="Amount"
                    value={`$${ticketData.amount.toFixed(2)}`}
                  />
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 active:scale-95 transition-all shadow"
              >
                Close
              </button>

              {!ticketData.checkoutAt && (
                <button
                  onClick={handleGoToCheckout}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow"
                >
                  Go to Checkout
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-sm bg-gray-50 p-2.5 rounded-lg">
      <span className="font-medium text-gray-700">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}
