import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";

const Admin = lazy(() => import("@/pages/Admin"));

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Suspense fallback={<div className="admin-loading" data-testid="admin-loading">प्रबंधन कक्ष खुल रहा है…</div>}><Admin /></Suspense>} />
    </Routes>
  );
}
