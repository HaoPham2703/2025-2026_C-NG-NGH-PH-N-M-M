import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "react-query";
import { droneApi } from "../api/droneApi";
import { orderApi } from "../api/orderApi";
import {
  MapPin,
  Navigation,
  Battery,
  Clock,
  Package,
  ArrowLeft,
  Loader,
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";

const DroneTrackingPage = () => {
  const { orderId } = useParams();
  const [map, setMap] = useState(null);
  const [droneMarker, setDroneMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [path, setPath] = useState([]);
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch order data
  const { data: orderData, isLoading: orderLoading } = useQuery(
    ["order", orderId],
    () => orderApi.getOrder(orderId),
    {
      enabled: !!orderId,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch drone data
  const {
    data: droneData,
    isLoading: droneLoading,
    refetch: refetchDrone,
  } = useQuery(["drone", orderId], () => droneApi.getDroneByOrderId(orderId), {
    enabled: !!orderId,
    refetchOnWindowFocus: false,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Initialize map (using simple Leaflet-like approach)
  useEffect(() => {
    if (!orderId) return;

    // Load Socket.IO client if available (optional)
    const loadSocketIO = () => {
      return new Promise((resolve) => {
        if (window.io) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.socket.io/4.6.1/socket.io.min.js";
        script.onload = resolve;
        script.onerror = resolve; // Continue even if Socket.IO fails
        document.head.appendChild(script);
      });
    };

    // Load Leaflet CSS and JS dynamically
    const loadLeaflet = () => {
      return new Promise((resolve) => {
        // Check if Leaflet is already loaded
        if (window.L && document.querySelector('link[href*="leaflet"]')) {
          resolve();
          return;
        }

        // Load CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        // Load JS
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };

    loadSocketIO()
      .then(() => {
        return loadLeaflet();
      })
      .then(() => {
        if (window.L && !mapRef.current) {
          // Default location (Ho Chi Minh City)
          const defaultLat = 10.7769;
          const defaultLon = 106.7009;

          const mapInstance = window.L.map("map-container").setView(
            [defaultLat, defaultLon],
            13
          );

          // Add tile layer
          window.L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }
          ).addTo(mapInstance);

          mapRef.current = mapInstance;
          setMap(mapInstance);

          // Fit bounds when drone data is available
          if (droneData?.data) {
            const drone = droneData.data;
            if (drone.currentLocation && drone.destination) {
              const bounds = [
                [
                  drone.currentLocation.latitude,
                  drone.currentLocation.longitude,
                ],
                [drone.destination.latitude, drone.destination.longitude],
              ];
              mapInstance.fitBounds(bounds, { padding: [50, 50] });
            }
          }
        }
      });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMap(null);
      }
    };
  }, [orderId, droneData]);

  // Update map markers when drone data changes
  useEffect(() => {
    if (!map || !droneData?.data) return;

    const drone = droneData.data;

    // Remove existing markers
    if (droneMarker) {
      map.removeLayer(droneMarker);
    }
    if (destinationMarker) {
      map.removeLayer(destinationMarker);
    }

    // Add destination marker
    if (drone.destination) {
      const destMarker = window.L.marker(
        [drone.destination.latitude, drone.destination.longitude],
        {
          icon: window.L.divIcon({
            className: "destination-marker",
            html: `<div style="background: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }
      ).addTo(map);

      destMarker.bindPopup(
        `<b>Điểm đến</b><br/>${
          drone.destination.address || "Địa chỉ giao hàng"
        }`
      );

      setDestinationMarker(destMarker);
    }

    // Add drone marker
    if (drone.currentLocation) {
      const marker = window.L.marker(
        [drone.currentLocation.latitude, drone.currentLocation.longitude],
        {
          icon: window.L.divIcon({
            className: "drone-marker",
            html: `<div style="background: #3b82f6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 18px;">🚁</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }
      ).addTo(map);

      marker.bindPopup(
        `<b>Drone ${drone.name}</b><br/>Trạng thái: ${getStatusText(
          drone.status
        )}<br/>Pin: ${drone.batteryLevel}%`
      );

      setDroneMarker(marker);

      // Draw path line if we have flight history
      if (drone.flightHistory && drone.flightHistory.length > 0) {
        const flightPath = [
          ...drone.flightHistory.map((point) => [
            point.latitude,
            point.longitude,
          ]),
          [drone.currentLocation.latitude, drone.currentLocation.longitude],
        ];

        if (path) {
          map.removeLayer(path);
        }

        const polyline = window.L.polyline(flightPath, {
          color: "#3b82f6",
          weight: 3,
          opacity: 0.7,
        }).addTo(map);

        setPath(polyline);
      }

      // Draw line from current position to destination
      if (drone.destination) {
        const routeLine = window.L.polyline(
          [
            [drone.currentLocation.latitude, drone.currentLocation.longitude],
            [drone.destination.latitude, drone.destination.longitude],
          ],
          {
            color: "#10b981",
            weight: 2,
            opacity: 0.5,
            dashArray: "10, 5",
          }
        ).addTo(map);
      }

      // Center map on drone
      map.setView(
        [drone.currentLocation.latitude, drone.currentLocation.longitude],
        map.getZoom()
      );
    }
  }, [map, droneData]);

  // Socket.IO connection for real-time updates (if socket.io-client is available)
  // Otherwise, use polling via refetchInterval
  useEffect(() => {
    if (!orderId) return;

    // Try to use Socket.IO if available
    if (window.io) {
      const socket = window.io("http://localhost:4007", {
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        console.log("Socket.IO connected");
        socket.emit("join:order", orderId);
      });

      socket.on("drone:update", (data) => {
        if (data.orderId === orderId) {
          // Refetch drone data when update is received
          refetchDrone();
        }
      });

      socket.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
      });

      socketRef.current = socket;

      return () => {
        if (socketRef.current) {
          socketRef.current.emit("leave:order", orderId);
          socketRef.current.disconnect();
        }
      };
    }
    // If Socket.IO is not available, the refetchInterval in useQuery will handle updates
  }, [orderId, refetchDrone]);

  const getStatusText = (status) => {
    const statusMap = {
      available: "Sẵn sàng",
      assigned: "Đã gán",
      flying: "Đang bay",
      delivering: "Đang giao hàng",
      returning: "Đang quay về",
      maintenance: "Bảo trì",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      available: "bg-green-100 text-green-800",
      assigned: "bg-blue-100 text-blue-800",
      flying: "bg-purple-100 text-purple-800",
      delivering: "bg-yellow-100 text-yellow-800",
      returning: "bg-gray-100 text-gray-800",
      maintenance: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const breadcrumbItems = [
    { label: "Trang Chủ", path: "/" },
    { label: "Đơn Hàng", path: "/orders" },
    {
      label: `Theo dõi Drone #${orderId?.slice(-8).toUpperCase()}`,
      path: `/drone-tracking/${orderId}`,
    },
  ];

  if (orderLoading || droneLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const order = orderData?.data?.order;
  const drone = droneData?.data;

  if (!drone) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Breadcrumb items={breadcrumbItems} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Chưa có drone được gán cho đơn hàng này
            </h2>
            <p className="text-gray-600 mb-6">
              Đơn hàng của bạn chưa có drone được gán để giao hàng.
            </p>
            <Link
              to={`/orders/${orderId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đơn hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const distanceToDestination =
    drone.currentLocation && drone.destination
      ? calculateDistance(
          drone.currentLocation.latitude,
          drone.currentLocation.longitude,
          drone.destination.latitude,
          drone.destination.longitude
        )
      : 0;

  const estimatedMinutes =
    drone.speed > 0
      ? Math.round((distanceToDestination / drone.speed) * 60)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Theo dõi Drone Giao Hàng
            </h1>
            <p className="text-gray-600">
              Đơn hàng #{orderId?.slice(-8).toUpperCase()}
            </p>
          </div>
          <Link
            to={`/orders/${orderId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div
                id="map-container"
                className="w-full h-[600px]"
                style={{ zIndex: 0 }}
              />
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Drone Status Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary-600" />
                Trạng thái Drone
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tên Drone</p>
                  <p className="font-semibold text-gray-900">{drone.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      drone.status
                    )}`}
                  >
                    {getStatusText(drone.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <Battery className="w-4 h-4" />
                    Pin
                  </p>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-gray-600">
                          {drone.batteryLevel}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow h-2 mb-4 flex rounded bg-gray-200">
                      <div
                        style={{ width: `${drone.batteryLevel}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          drone.batteryLevel > 50
                            ? "bg-green-500"
                            : drone.batteryLevel > 20
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tốc độ</p>
                  <p className="font-semibold text-gray-900">
                    {drone.speed} km/h
                  </p>
                </div>
              </div>
            </div>

            {/* Location Info */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                Vị trí
              </h2>
              <div className="space-y-4">
                {drone.currentLocation && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Vị trí hiện tại
                    </p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {drone.currentLocation.latitude.toFixed(6)},
                      {drone.currentLocation.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Độ cao: {drone.currentLocation.altitude}m
                    </p>
                  </div>
                )}
                {drone.destination && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Điểm đến</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {drone.destination.address || "Địa chỉ giao hàng"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {drone.destination.latitude.toFixed(6)},
                      {drone.destination.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
                {distanceToDestination > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Khoảng cách
                    </p>
                    <p className="font-semibold text-gray-900">
                      {distanceToDestination.toFixed(2)} km
                    </p>
                    {estimatedMinutes > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ước tính: {estimatedMinutes} phút
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Order Info */}
            {order && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-600" />
                  Đơn hàng
                </h2>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Người nhận</p>
                  <p className="font-semibold text-gray-900">
                    {order.receiver}
                  </p>
                  <p className="text-sm text-gray-600 mt-3">Địa chỉ</p>
                  <p className="text-sm text-gray-900">{order.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroneTrackingPage;
