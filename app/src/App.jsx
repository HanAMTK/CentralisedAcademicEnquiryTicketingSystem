import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudentPortalHome from "./pages/StudentPortal/Home.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentPortalHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;