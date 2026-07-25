import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Homepage from "./pages/Homepage";
import MenuPage from "./pages/Menu";
import Payment from "./pages/Payment";
import Reservation from "./pages/Reservation";
import AboutUs from "./pages/AboutUs";
import Tray from "./pages/Tray";
import "./index.css";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Homepage /> },
      { path: "menu", element: <MenuPage /> },
      { path: "payment", element: <Payment /> },
      { path: "reservation", element: <Reservation /> },
      { path: "about", element: <AboutUs /> },
      { path: "tray", element: <Tray /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);