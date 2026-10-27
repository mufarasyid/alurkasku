import { Outlet } from "react-router";
import Sidebar from "../templates/Sidebar";

const DashboardLayout = () => {
  return (
    <div className="w-screen h-full">
      <div className="w-64 h-screen fixed top-0 left-0">
        <Sidebar />
      </div>
      <div className="flex min-h-screen flex-col pl-70 p-6">
        <div className="flex-1 border border-dashed border-gray-300 rounded-lg">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
