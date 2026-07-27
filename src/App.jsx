import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Outlet } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import TrayPanel from "./components/TrayPanel";
import FlyingItems from "./components/FlyingItems";
import { CartProvider } from "./context/CartContext";
import "./App.css";

export default function App() {
  return (
    <CartProvider>
      <div className="app-layout">
        <ScrollToTop />
        <Navbar />

        <main className="app-main pt-20">
          <Outlet />
        </main>

        <Footer />
        <TrayPanel />
        <FlyingItems />
      </div>
    </CartProvider>
  );
}