import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudentPortalHome from "./pages/StudentPortal/Home.jsx";
import LecturerPortalHome from "./pages/LecturerPortal/Home.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentPortalHome />} />
        <Route path="/lecturer" element={<LecturerPortalHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;