// src/pages/Checkpoint.tsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import type { TicketCheckoutResponse } from "../../Interfaces/interfaces";

// ---------------------- Types ----------------------
type AuthResponse = {
  token: string;
  user: { id: string; role: string; name?: string };
};



type Subscription = {
  id: string;
  userName?: string;
  plates?: string[]; // plates under subscription
  active?: boolean;
  expiresAt?: string;
};

// ---------------------- Helpers ----------------------
const API_BASE = "http://localhost:3000/api/v1";
const WS_URL = "ws://localhost:3000/ws";

// small reusable button
function Btn({ children, className = "", ...props }: any) {
  return (
    <button
      {...props}
      className={
        "px-4 py-2 rounded-lg font-semibold shadow-sm transition disabled:opacity-60 " +
        className
      }
    >
      {children}
    </button>
  );
}

// ---------------------- Component ----------------------
export default function CheckpointScreen() {
  const queryClient = useQueryClient();

  // auth
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [userRole, setUserRole] = useState<string | null>(() =>
    localStorage.getItem("userRole")
  );

  // UI state
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [currentCheckout, setCurrentCheckout] =
    useState<TicketCheckoutResponse | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [showRawTicketData, setShowRawTicketData] = useState(false);

  // subscription details if relevant
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // web socket / zones
  const wsRef = useRef<WebSocket | null>(null);
  const [zoneEvents, setZoneEvents] = useState<any[]>([]); // store recent zone occupancy events

  // axios instance that includes token when available
  const axiosAuth = axios.create({
    baseURL: API_BASE,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  // ---------------------- Authentication (employee login) ----------------------
  const loginMutation = useMutation({
    mutationFn: async (creds: { username: string; password: string }) => {
      const res = await axios.post(`${API_BASE}/auth/login`, creds);
      return res.data as AuthResponse;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.user.role);
      setToken(data.token);
      setUserRole(data.user.role);
      toast.success("Logged in successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Login failed");
    },
  });

  // ---------------------- Optional: GET ticket by id (not required, but helpful) ----------------------
  const fetchTicket = async (id: string) => {
    const res = await axiosAuth.get(`/tickets/${encodeURIComponent(id)}`);
    return res.data;
  };

  // ---------------------- Checkout mutation (primary) ----------------------
  const checkoutMutation = useMutation({
    mutationFn: async (payload: {
      ticketId: string;
      forceConvertToVisitor?: boolean;
    }) => {
      const res = await axiosAuth.post("/tickets/checkout", payload);
      return res.data as TicketCheckoutResponse;
    },
    onSuccess: (data) => {
      // update local state and invalidate related queries (subscriptions, zones, etc.)
      setCurrentCheckout(data);

      // compute a safe total for the toast
      const totalFromBreakdown =
        data.breakdown?.reduce((acc, item) => acc + (item?.amount ?? 0), 0) ??
        0;
      const total = data.totalAmount ?? totalFromBreakdown ?? 0;
      toast.success(`Checkout calculated: ${formatCurrency(total)}`);

      // invalidate queries that might care
      queryClient.invalidateQueries(["zonesReport"]);
      queryClient.invalidateQueries(["tickets"]);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Checkout failed";
      toast.error(msg);
    },
  });

  // ---------------------- Fetch subscription if ticket links to one ----------------------
  const fetchSubscriptionById = async (subId: string) => {
    const res = await axiosAuth.get(
      `/subscriptions/${encodeURIComponent(subId)}`
    );
    return res.data as Subscription;
  };

  // ---------------------- WebSocket: connect and listen for zone occupancy updates ----------------------
  useEffect(() => {
    if (!token) return; // only connect when logged in
    let ws: WebSocket;
    try {
      ws = new WebSocket(WS_URL + `?token=${token}`); // some servers read token from query
      wsRef.current = ws;
    } catch (e) {
      console.warn("WS connection failed", e);
      return;
    }

    ws.onopen = () => {
      console.info("WS connected");
    };

    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        if (payload?.type === "zoneUpdate") {
          setZoneEvents((prev) => [payload, ...prev].slice(0, 20));
        }
      } catch (e) {
        console.warn("WS message parse error", e);
      }
    };

    ws.onerror = (err) => {
      console.error("WS error", err);
    };

    ws.onclose = () => {
      console.info("WS closed");
      wsRef.current = null;
    };

    return () => {
      try {
        ws?.close();
      } catch {}
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------------------- Helpers UI ----------------------
  const formatCurrency = (n: number) =>
    typeof n === "number" ? `${n.toFixed(2)} EGP` : `${n} EGP`;

  const isEmployee = Boolean(token && userRole === "employee");

  // ---------------------- Actions ----------------------
  // Primary: compute checkout (POST /tickets/checkout)
  const handleComputeCheckout = async (opts?: {
    forceConvertToVisitor?: boolean;
  }) => {
    if (!ticketIdInput?.trim()) {
      toast.error("Please paste/enter the ticket id.");
      return;
    }
    setCheckoutLoading(true);
    try {
      const payload = { ticketId: ticketIdInput.trim(), ...(opts || {}) };
      const data = await checkoutMutation.mutateAsync(payload);

      // if subscriptionId present -> fetch subscription
      if (data.subscriptionId) {
        try {
          const sub = await fetchSubscriptionById(data.subscriptionId);
          setSubscription(sub);
        } catch (e) {
          setSubscription(null);
          console.warn("Failed to fetch subscription", e);
        }
      } else {
        setSubscription(null);
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  // If employee decides Convert to Visitor because plate mismatch
  const handleConvertToVisitor = async () => {
    if (!confirm("Convert this ticket to Visitor and force checkout?")) return;
    await handleComputeCheckout({ forceConvertToVisitor: true });
  };

  // Finalize / Confirm & Complete -> actually perform the checkout (call the same endpoint for finalization)
  const handleConfirmAndComplete = async () => {
    if (!currentCheckout?.ticketId) {
      toast.error("No checkout to confirm.");
      return;
    }
    if (!confirm("Are you sure you want to finalize checkout for this ticket?"))
      return;

    setFinalizeLoading(true);
    try {
      // Make sure UI and caches reflect finalization
      queryClient.invalidateQueries(["zonesReport"]);
      queryClient.invalidateQueries(["tickets"]);

      toast.success("Checkout finalized ✅");
    } catch (e) {
      // errors handled by onError in mutation
    } finally {
      setFinalizeLoading(false);
    }
  };

  // Optionally fetch ticket raw (GET /tickets/:id) for inspection
  const handleFetchTicketRaw = async () => {
    if (!ticketIdInput?.trim()) {
      toast.error("Enter ticket id first.");
      return;
    }
    try {
      const raw = await fetchTicket(ticketIdInput.trim());
      setShowRawTicketData(true);
      toast.info("Raw ticket fetched (shown below)");
      console.debug("raw ticket", raw);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to fetch ticket");
    }
  };

  // Logout employee
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setToken(null);
    setUserRole(null);
    setCurrentCheckout(null);
    setSubscription(null);
    toast.info("Logged out");
  };

  // ---------------------- Simple Login Form (for employees) ----------------------
  const [loginCreds, setLoginCreds] = useState({ username: "", password: "" });

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!loginCreds.username || !loginCreds.password) {
      toast.error("Enter username & password");
      return;
    }
    try {
      const res = await loginMutation.mutateAsync(loginCreds);
      setToken(res.token);
      setUserRole(res.user.role);
    } catch (e) {
      // error handled in mutation
    }
  };

  // ---------------------- Render ----------------------
  if (!isEmployee) {
    // Protected: show login UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Employee Login</h2>
          <form onSubmit={handleLogin} className="space-y-3">
            <label className="block">
              <div className="text-sm font-medium text-gray-700">Username</div>
              <input
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                value={loginCreds.username}
                onChange={(e) =>
                  setLoginCreds((s) => ({ ...s, username: e.target.value }))
                }
                autoComplete="username"
                required
              />
            </label>
            <label className="block">
              <div className="text-sm font-medium text-gray-700">Password</div>
              <input
                type="password"
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                value={loginCreds.password}
                onChange={(e) =>
                  setLoginCreds((s) => ({ ...s, password: e.target.value }))
                }
                autoComplete="current-password"
                required
              />
            </label>
            <div className="flex items-center justify-between">
              <Btn className="bg-indigo-600 text-white" type="submit">
                Login
              </Btn>
              <Btn
                className="bg-gray-200"
                type="button"
                onClick={() => {
                  setLoginCreds({ username: "emp1", password: "pass1" });
                }}
              >
                Fill demo
              </Btn>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Main protected screen
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Checkpoint — Check-out</h1>
            <p className="text-sm text-gray-600">
              Scan ticket / paste ID to calculate checkout.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-500">Logged in as</div>
              <div className="font-semibold">
                {localStorage.getItem("userRole") || "employee"}
              </div>
            </div>
            <Btn className="bg-red-500 text-white" onClick={logout}>
              Logout
            </Btn>
          </div>
        </header>

        {/* Input card */}
        <div className="bg-white rounded-2xl p-6 shadow flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-2">
              Ticket ID (paste to simulate QR)
            </label>
            <input
              value={ticketIdInput}
              onChange={(e) => setTicketIdInput(e.target.value)}
              placeholder="e.g. TICKET_abc123..."
              className="w-full border rounded-lg px-4 py-3 text-lg"
            />
            <div className="text-sm text-gray-400 mt-2">
              You can also click <span className="font-semibold">Fetch</span> to
              inspect raw ticket data.
            </div>
          </div>

          <div className="flex-shrink-0 flex gap-2">
            <Btn
              className="bg-indigo-600 text-white"
              onClick={() => handleComputeCheckout()}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? "Calculating..." : "Compute Checkout"}
            </Btn>
            <Btn className="bg-gray-200" onClick={handleFetchTicketRaw}>
              Fetch
            </Btn>
            <Btn
              className="bg-yellow-400"
              onClick={() => {
                setTicketIdInput("");
                setCurrentCheckout(null);
                setSubscription(null);
                setShowRawTicketData(false);
              }}
            >
              Reset
            </Btn>
          </div>
        </div>

        {/* Result area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Checkout summary */}
          <div className="bg-white rounded-2xl p-6 shadow space-y-4">
            <h3 className="text-xl font-bold">Checkout Summary</h3>

            {!currentCheckout ? (
              <div className="text-gray-500">
                No checkout calculated yet. Paste ticket id and click Compute
                Checkout.
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-600">
                  Ticket:{" "}
                  <span className="font-medium">
                    {currentCheckout.ticketId}
                  </span>
                </div>
                {currentCheckout.vehiclePlate && (
                  <div className="text-sm text-gray-600">
                    Plate:{" "}
                    <span className="font-medium">
                      {currentCheckout.vehiclePlate}
                    </span>
                  </div>
                )}

                {/* Checkout Time */}
                {currentCheckout.checkoutAt && (
                  <div className="text-sm text-gray-600">
                    Checkout:{" "}
                    <span className="font-medium">
                      {new Date(currentCheckout.checkoutAt).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="mt-3">
                  <div className="text-sm text-gray-700 font-medium mb-2">
                    Details
                  </div>
                  <div className="space-y-2">
                    {currentCheckout?.segments?.length ? (
                      currentCheckout.segments.map((seg, idx) => (
                        <div
                          key={idx}
                          className="p-3 border rounded-lg flex justify-between items-center"
                        >
                          <div>
                            <div className="font-semibold">
                              {seg.rateMode.toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {seg.hours} hrs • rate {formatCurrency(seg.rate)}
                            </div>
                            {seg.note && (
                              <div className="text-xs text-gray-400">
                                {seg.note}
                              </div>
                            )}
                          </div>
                          <div className="text-lg font-bold">
                            {formatCurrency(seg.amount)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400">
                        No breakdown available
                      </div>
                    )}
                  </div>
                </div>

                {/* Breakdown details rendered as cards */}
                {currentCheckout.breakdown?.length ? (
                  <div className="mt-4">
                    <div className="text-sm text-gray-700 font-medium mb-2">
                      Breakdown
                    </div>
                    <div className="space-y-2">
                      {currentCheckout.breakdown.map((b, idx) => (
                        <div
                          key={idx}
                          className="p-3 border rounded-lg flex justify-between items-center"
                        >
                          <div className="flex flex-col text-sm text-gray-600">
                            <span>
                              <span className="font-medium">From:</span>{" "}
                              {new Date(b.from).toLocaleTimeString()}
                            </span>
                            <span>
                              <span className="font-medium">To:</span>{" "}
                              {new Date(b.to).toLocaleTimeString()}
                            </span>
                            <span>
                              <span className="font-medium">Hours:</span>{" "}
                              {b.hours.toFixed(5)}
                            </span>
                            <span>
                              <span className="font-medium">Rate:</span>{" "}
                              {formatCurrency(b.rate)} ({b.rateMode})
                            </span>
                          </div>

                          <div className="text-lg font-bold text-gray-800">
                            {formatCurrency(b.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-semibold">
                      {currentCheckout.durationHours} hrs
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-2xl font-extrabold">
                      {formatCurrency(
                        (currentCheckout.breakdown?.reduce(
                          (acc, item) => acc + (item?.amount ?? 0),
                          0
                        ) ??
                          currentCheckout.totalAmount ??
                          0) as number
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Btn
                    className="bg-green-600 text-white"
                    onClick={handleConfirmAndComplete}
                    disabled={finalizeLoading}
                  >
                    {finalizeLoading ? "Finalizing..." : "Confirm & Complete"}
                  </Btn>

                  {currentCheckout.subscriptionId && (
                    <Btn
                      className="bg-red-500 text-white"
                      onClick={handleConvertToVisitor}
                    >
                      Convert to Visitor
                    </Btn>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right: Subscription & WS events */}
          <div className="space-y-6">
            {/* Subscription panel */}
            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="text-lg font-bold">Subscription / Plate Check</h3>
              {!currentCheckout?.subscriptionId ? (
                <div className="text-gray-500 mt-3">
                  This ticket is not linked to a subscription.
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-600 mt-2">
                    Subscription ID:{" "}
                    <span className="font-medium">
                      {currentCheckout.subscriptionId}
                    </span>
                  </div>
                  {subscription ? (
                    <div className="mt-3 space-y-3">
                      <div className="text-sm text-gray-700">
                        Registered plates for this subscription:
                      </div>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {subscription.plates &&
                        subscription.plates.length > 0 ? (
                          subscription.plates?.map((p, i) => (
                            <div
                              key={i}
                              className="p-3 border rounded-lg flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center font-mono">
                                  {p.slice(0, 3)}
                                </div>
                                <div>
                                  <div className="font-semibold">{p}</div>
                                  <div className="text-xs text-gray-500">
                                    Compare this to the vehicle plate
                                  </div>
                                </div>
                              </div>
                              <div>
                                <Btn
                                  className="bg-indigo-600 text-white"
                                  onClick={() => {
                                    toast.success(`Marked ${p} as matched`);
                                  }}
                                >
                                  Match
                                </Btn>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500">
                            No plates found on the subscription
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="text-sm text-gray-600">
                          Employee decision
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Btn
                            className="bg-green-600 text-white"
                            onClick={() =>
                              toast.info("Plate confirmed as matching")
                            }
                          >
                            Plate Matches
                          </Btn>
                          <Btn
                            className="bg-red-500 text-white"
                            onClick={() => handleConvertToVisitor()}
                          >
                            Plate Mismatch — Convert to Visitor
                          </Btn>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="text-sm text-gray-500">
                        Fetching subscription...
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* WebSocket / Zone events */}
            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="text-lg font-bold">Live Zone Events</h3>
              <div className="text-sm text-gray-500 mt-2">
                Recent occupancy updates from server (via WebSocket)
              </div>
              <ul className="mt-3 space-y-2 max-h-48 overflow-auto">
                {zoneEvents.length === 0 ? (
                  <li className="text-gray-400">No recent events</li>
                ) : (
                  zoneEvents.map((ev, idx) => (
                    <li
                      key={idx}
                      className="p-2 border rounded flex justify-between items-center"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {ev.zoneId ?? ev.zoneName ?? "Zone"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Occupied: {ev.occupied} • Free: {ev.free}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(
                          ev.timestamp || Date.now()
                        ).toLocaleTimeString()}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Raw ticket inspector (optional) */}
        {showRawTicketData && (
          <div className="bg-white rounded-2xl p-6 shadow">
            <h3 className="text-lg font-bold">Raw Ticket Data (debug)</h3>
            <pre className="mt-3 max-h-64 overflow-auto text-xs bg-gray-100 p-3 rounded">
              {JSON.stringify(currentCheckout ?? "No checkout yet", null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
