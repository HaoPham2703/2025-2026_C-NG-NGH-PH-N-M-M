import { useAuth } from "../hooks/useAuth";
import { useParams } from "react-router-dom";
import DashboardPage from "../pages-admin/DashboardPage";
import DroneTrackingPage from "./DroneTrackingPage";

const DroneTrackingWrapper = () => {
  const { user } = useAuth();
  const { orderId } = useParams();

  // Nếu là admin, render trong DashboardPage layout
  if (user?.role === "admin") {
    // Render trong DashboardPage với hideHeader
    return <DroneTrackingPage hideHeader={true} />;
  }

  // Nếu không phải admin, render bình thường
  return <DroneTrackingPage hideHeader={false} />;
};

export default DroneTrackingWrapper;
