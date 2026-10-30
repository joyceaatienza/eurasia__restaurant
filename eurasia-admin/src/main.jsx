import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const originalRemove = Storage.prototype.removeItem;
Storage.prototype.removeItem = function (key) {
  if (key === "eurasia_role") console.trace("eurasia_role was removed here");
  return originalRemove.apply(this, arguments);
};

const originalClear = Storage.prototype.clear;
Storage.prototype.clear = function () {
  console.trace("localStorage.clear() was called here");
  return originalClear.apply(this, arguments);
};

window.addEventListener("storage", (e) => {
  if (e.key === "eurasia_role" || e.key === null) {
    console.warn("Another tab/app changed the login:", e.url);
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)