import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "./Store/Store";
import { useEffect } from "react";
import Layout from "./Components/Layout/Layout";
import Home from "./Pages/Home/Home";
import GateScreen from "./Pages/GateScreen/GateScreen";
import { Bounce, ToastContainer } from "react-toastify";
import Dashboard from "./Pages/Dashboard/Dashboard";
import CheckpointScreen from "./Pages/CheckpointScreen/CheckpointScreen";
import NotFound from "./Pages/Notfound/Notfound";

async function loadPreline() {
  return import("preline/dist/index.js");
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "gate/:gateId",
        element: <GateScreen />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },

      {
        path: "checkpoint",
        element: <CheckpointScreen />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

function App() {
  useEffect(() => {
    const initPreline = async () => {
      await loadPreline();

      if (
        window.HSStaticMethods &&
        typeof window.HSStaticMethods.autoInit === "function"
      ) {
        window.HSStaticMethods.autoInit();
      }
    };

    initPreline();
  }, [location.pathname]);

  const queryClient = new QueryClient();
  return (
    <>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </Provider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Bounce}
      />
    </>
  );
}

export default App;
