import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
import { droneApi } from "../api/droneApi";
import { orderApi } from "../api/orderApi";
import { useAuth } from "../hooks/useAuth";
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

const DroneTrackingPage = ({ hideHeader = false }) => {
  const { orderId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [map, setMap] = useState(null);
  const [droneMarker, setDroneMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [startMarker, setStartMarker] = useState(null);
  const [path, setPath] = useState(null);
  const mapRef = useRef(null);
  const socketRef = useRef(null);
  const initialBoundsSetRef = useRef(false); // Track if initial bounds have been set (same as DroneHubPage)
  const droneMarkerRef = useRef(null); // Keep reference to current drone marker
  const pathRef = useRef(null); // Keep reference to current path
  const mapStateRef = useRef(null); // Keep reference to current map

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
  // Use useState to keep previous drone data during refetch/updates
  const [previousDroneData, setPreviousDroneData] = useState(null);

  const {
    data: droneData,
    isLoading: droneLoading,
    isFetching: droneFetching,
    refetch: refetchDrone,
  } = useQuery(["drone", orderId], () => droneApi.getDroneByOrderId(orderId), {
    enabled: !!orderId,
    refetchOnWindowFocus: false,
    refetchInterval: 5000, // Auto refresh every 5 seconds (same as DroneHubPage)
    staleTime: 2000, // Consider data fresh for 2 seconds
    onSuccess: (data) => {
      // Update previous data when new data arrives (including battery updates)
      if (data) {
        setPreviousDroneData(data);
      }
    },
    // Keep previous data during refetch to prevent blank screen
    keepPreviousData: true,
  });

  // Use current droneData or fallback to previous data during refetch/updates
  // This prevents blank screen when battery level updates
  const effectiveDroneData = droneData || previousDroneData;

  // Update previous data when new data arrives (backup for keepPreviousData)
  // This ensures we always have data to render even during refetch
  useEffect(() => {
    if (droneData) {
      // Always update previous data when new data arrives
      setPreviousDroneData(droneData);
    }
  }, [droneData]);

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

          // Fit bounds will be handled in useEffect when effectiveDroneData is available
          // Just initialize map here
        }
      });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMap(null);
      }
    };
  }, [orderId, effectiveDroneData]);

  // Update refs when values change (for socket handler access)
  useEffect(() => {
    droneMarkerRef.current = droneMarker;
    pathRef.current = path;
    mapStateRef.current = map;
  }, [map, droneMarker, path]);

  // Update map markers when drone data changes
  useEffect(() => {
    if (!map) return;

    // Use effectiveDroneData to prevent blank screen during refetch/updates
    if (!effectiveDroneData) {
      return;
    }

    // Handle different response structures
    let drone = null;
    try {
      if (effectiveDroneData.status === "success" && effectiveDroneData.data) {
        drone = effectiveDroneData.data;
      } else if (effectiveDroneData.data) {
        drone = effectiveDroneData.data.drone || effectiveDroneData.data;
      } else if (!effectiveDroneData.status && effectiveDroneData._id) {
        // Direct drone object (check for _id to ensure it's a drone object)
        drone = effectiveDroneData;
      }

      if (!drone || !drone.currentLocation) {
        console.warn(
          "[DroneTrackingPage] No drone or currentLocation in effectiveDroneData"
        );
        return;
      }
    } catch (error) {
      console.error("[DroneTrackingPage] Error parsing drone data:", error);
      return;
    }

    // Determine final destination (prefer deliveryDestination)
    const finalDest =
      (drone.deliveryDestination &&
      typeof drone.deliveryDestination.latitude === "number" &&
      typeof drone.deliveryDestination.longitude === "number"
        ? drone.deliveryDestination
        : null) ||
      (drone.destination &&
      typeof drone.destination.latitude === "number" &&
      typeof drone.destination.longitude === "number"
        ? drone.destination
        : null);

    // Fit bounds to show drone, restaurant, and final destination (only on initial load)
    if (finalDest && drone.currentLocation) {
      try {
        // Only fitBounds on initial load, not on every update (same approach as DroneHubPage)
        if (!initialBoundsSetRef.current) {
          const bounds = [
            [drone.currentLocation.latitude, drone.currentLocation.longitude],
            [finalDest.latitude, finalDest.longitude],
          ];
          if (
            drone.startLocation &&
            typeof drone.startLocation.latitude === "number" &&
            typeof drone.startLocation.longitude === "number"
          ) {
            bounds.push([
              drone.startLocation.latitude,
              drone.startLocation.longitude,
            ]);
          }
          map.fitBounds(bounds, { padding: [50, 50] });
          initialBoundsSetRef.current = true;
        }
      } catch (error) {
        console.error("[DroneTrackingPage] Error fitting bounds:", error);
      }
    }

    // Clear existing markers (same approach as DroneHubPage - recreate on each update)
    if (droneMarker) {
      try {
        map.removeLayer(droneMarker);
      } catch (error) {
        console.error(
          "[DroneTrackingPage] Error removing drone marker:",
          error
        );
      }
    }
    setDroneMarker(null);

    // Clear existing destination marker
    if (destinationMarker) {
      try {
        if (map.hasLayer(destinationMarker)) {
          map.removeLayer(destinationMarker);
        }
      } catch (error) {
        console.error(
          "[DroneTrackingPage] Error removing destination marker:",
          error
        );
      }
    }
    setDestinationMarker(null);

    // Clear existing start marker (restaurant)
    if (startMarker) {
      try {
        if (map.hasLayer(startMarker)) {
          map.removeLayer(startMarker);
        }
      } catch (error) {
        console.error(
          "[DroneTrackingPage] Error removing start marker:",
          error
        );
      }
    }
    setStartMarker(null);

    // Clear existing path
    if (path) {
      try {
        if (map.hasLayer(path)) {
          map.removeLayer(path);
        }
      } catch (error) {
        console.error("[DroneTrackingPage] Error removing path:", error);
      }
    }
    setPath(null);

    // Add destination marker (prefer deliveryDestination)
    if (finalDest) {
      try {
        console.log("[DroneTrackingPage] Adding destination marker:", {
          lat: finalDest.latitude,
          lng: finalDest.longitude,
          address: finalDest.address,
        });

        const destMarker = window.L.marker(
          [finalDest.latitude, finalDest.longitude],
          {
            icon: window.L.divIcon({
              className: "destination-marker",
              html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 14px;">📍</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
          }
        ).addTo(map);

        destMarker.bindPopup(
          `<b>📍 Điểm đến</b><br/>${
            finalDest.address || "Địa chỉ giao hàng"
          }<br/><small>${finalDest.latitude.toFixed(
            6
          )}, ${finalDest.longitude.toFixed(6)}</small>`
        );

        setDestinationMarker(destMarker);
      } catch (error) {
        console.error(
          "[DroneTrackingPage] Error adding destination marker:",
          error
        );
      }
    } else {
      console.warn("[DroneTrackingPage] No valid destination found:", {
        hasDeliveryDestination: !!drone.deliveryDestination,
        hasDestination: !!drone.destination,
        destination: finalDest,
      });
    }

    // Add start marker (restaurant) if present
    if (
      drone.startLocation &&
      typeof drone.startLocation.latitude === "number" &&
      typeof drone.startLocation.longitude === "number"
    ) {
      try {
        const sMarker = window.L.marker(
          [drone.startLocation.latitude, drone.startLocation.longitude],
          {
            icon: window.L.divIcon({
              className: "start-marker",
              html: `<div style=\"background: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 12px;\">🏪</div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            }),
          }
        ).addTo(map);

        sMarker.bindPopup(
          `<b>🏪 Nhà hàng</b><br/>${
            drone.startLocation.restaurantName || "Nhà hàng"
          }<br/><small>${
            drone.startLocation.address || "Địa chỉ nhà hàng"
          }</small><br/><small>${drone.startLocation.latitude.toFixed(
            6
          )}, ${drone.startLocation.longitude.toFixed(6)}</small>`
        );

        setStartMarker(sMarker);
      } catch (error) {
        console.error("[DroneTrackingPage] Error adding start marker:", error);
      }
    }

    // Add or update drone marker with smooth animation
    if (
      drone.currentLocation &&
      drone.currentLocation.latitude &&
      drone.currentLocation.longitude
    ) {
      try {
        const newLatLng = window.L.latLng(
          drone.currentLocation.latitude,
          drone.currentLocation.longitude
        );

        // Create new marker (same approach as DroneHubPage - recreate on each update)
        const marker = window.L.marker(newLatLng, {
          icon: window.L.divIcon({
            className: "drone-marker",
            html: `<div style="background: #3b82f6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 18px;">🚁</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }).addTo(map);

        marker.bindPopup(
          `<b>Drone ${drone.name || "N/A"}</b><br/>Trạng thái: ${getStatusText(
            drone.status || "unknown"
          )}<br/>Pin: ${parseFloat(drone.batteryLevel || 0).toFixed(2)}%`
        );

        setDroneMarker(marker);
      } catch (error) {
        console.error(
          "[DroneTrackingPage] Error adding/updating drone marker:",
          error
        );
      }

      // Draw or update path line from drone -> (restaurant?) -> final destination
      if (finalDest && drone.currentLocation) {
        try {
          const directPath = [
            [drone.currentLocation.latitude, drone.currentLocation.longitude],
          ];
          if (
            drone.startLocation &&
            typeof drone.startLocation.latitude === "number" &&
            typeof drone.startLocation.longitude === "number"
          ) {
            directPath.push([
              drone.startLocation.latitude,
              drone.startLocation.longitude,
            ]);
          }
          directPath.push([finalDest.latitude, finalDest.longitude]);

          // Create new path (same approach as DroneHubPage - recreate on each update)
          const polyline = window.L.polyline(directPath, {
            color: "#ef4444",
            weight: 2,
            opacity: 0.6,
            dashArray: "5, 10",
          }).addTo(map);

          setPath(polyline);
        } catch (error) {
          console.error(
            "[DroneTrackingPage] Error drawing path to destination:",
            error
          );
        }
      }

      // Also draw flight history if available (optional, for tracking path)
      if (
        drone.flightHistory &&
        Array.isArray(drone.flightHistory) &&
        drone.flightHistory.length > 0
      ) {
        try {
          const flightPath = [
            ...drone.flightHistory
              .filter((point) => point && point.latitude && point.longitude)
              .map((point) => [point.latitude, point.longitude]),
            [drone.currentLocation.latitude, drone.currentLocation.longitude],
          ];

          if (flightPath.length >= 2) {
            const historyPolyline = window.L.polyline(flightPath, {
              color: "#3b82f6",
              weight: 2,
              opacity: 0.4,
            }).addTo(map);
            // Store both lines, but we'll just keep the direct path as main path
          }
        } catch (error) {
          console.error(
            "[DroneTrackingPage] Error drawing flight history:",
            error
          );
        }
      }

      // Path line from drone to destination is already handled above in the useEffect
      // No need to duplicate it here

      // Don't reset zoom/view when updating markers
      // Let user control zoom level - only update marker positions
      // map.setView([...]) removed to preserve user's zoom level
    }
  }, [map, effectiveDroneData]);

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
          console.log(
            "[DroneTrackingPage] Received real-time drone update:",
            data
          );

          // Update drone marker position in real-time (smooth animation)
          // Use refs to get current values (avoid stale closures)
          const currentMarker = droneMarkerRef.current;
          const currentMap = mapStateRef.current;
          const currentPath = pathRef.current;

          if (currentMarker && data.location) {
            try {
              const newLatLng = window.L.latLng(
                data.location.latitude,
                data.location.longitude
              );

              // Get current drone name from query cache if not available
              const currentDrone = queryClient.getQueryData([
                "drone",
                orderId,
              ])?.data;

              // Smoothly animate marker to new position
              // Use shorter duration for more real-time feel (0.5 seconds)
              currentMarker.setLatLng(newLatLng, {
                animate: true,
                duration: 0.5, // 0.5 second animation for smoother real-time feel
                easeLinearity: 0.25,
              });

              // Update popup with new battery info
              currentMarker.setPopupContent(
                `<b>Drone ${
                  currentDrone?.name || "N/A"
                }</b><br/>Trạng thái: ${getStatusText(
                  data.status || currentDrone?.status || "unknown"
                )}<br/>Pin: ${parseFloat(
                  data.batteryLevel !== undefined
                    ? data.batteryLevel
                    : currentDrone?.batteryLevel || 0
                ).toFixed(2)}%`
              );
            } catch (error) {
              console.error(
                "[DroneTrackingPage] Error updating marker in socket:",
                error
              );
            }
          }

          // Update path line from drone to destination (smooth update)
          if (currentPath && currentMap && data.location) {
            try {
              // Get destination from query cache
              const currentDrone = queryClient.getQueryData([
                "drone",
                orderId,
              ])?.data;
              const finalDestSocket =
                currentDrone?.deliveryDestination || currentDrone?.destination;
              if (finalDestSocket) {
                const newPath = [
                  [data.location.latitude, data.location.longitude],
                ];
                if (
                  currentDrone?.startLocation &&
                  typeof currentDrone.startLocation.latitude === "number" &&
                  typeof currentDrone.startLocation.longitude === "number"
                ) {
                  newPath.push([
                    currentDrone.startLocation.latitude,
                    currentDrone.startLocation.longitude,
                  ]);
                }
                newPath.push([
                  finalDestSocket.latitude,
                  finalDestSocket.longitude,
                ]);

                if (currentMap.hasLayer(currentPath)) {
                  // Update existing path smoothly
                  currentPath.setLatLngs(newPath);
                } else {
                  // Create new path if it doesn't exist
                  const newPolyline = window.L.polyline(newPath, {
                    color: "#ef4444",
                    weight: 2,
                    opacity: 0.6,
                    dashArray: "5, 10",
                  }).addTo(currentMap);

                  setPath(newPolyline);
                }
              }
            } catch (error) {
              console.error(
                "[DroneTrackingPage] Error updating path in socket:",
                error
              );
            }
          }

          // Also update query cache to keep data in sync
          // But don't trigger full refetch to avoid blank screen
          queryClient.setQueryData(["drone", orderId], (oldData) => {
            if (!oldData) return oldData;

            // Update the drone data structure with new location
            const updatedData = { ...oldData };
            if (updatedData.data) {
              updatedData.data = {
                ...updatedData.data,
                currentLocation:
                  data.location || updatedData.data.currentLocation,
                batteryLevel:
                  data.batteryLevel !== undefined
                    ? data.batteryLevel
                    : updatedData.data.batteryLevel,
                status: data.status || updatedData.data.status,
              };
            }

            return updatedData;
          });
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
    // Note: queryClient is stable and doesn't need to be in deps
    // map, droneMarker, path are accessed via refs to avoid re-creating socket connection
  }, [orderId, queryClient]);

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

  // Parse order data
  const order = orderData?.data?.order;

  // Handle drone data - check different possible response structures
  // IMPORTANT: Use effectiveDroneData to prevent blank screen during refetch
  // Also try to parse from previousDroneData as fallback
  const parseDroneFromData = (data) => {
    if (!data) return null;

    // Handle different API response structures
    if (data.status === "success" && data.data) {
      return data.data;
    } else if (data.data) {
      // Some APIs return { data: { drone } }
      return data.data.drone || data.data;
    } else if (!data.status && data._id) {
      // Direct drone object (check for _id to ensure it's a drone object)
      return data;
    }
    return null;
  };

  // Try to parse from effectiveDroneData first, then fallback to previousDroneData
  let drone = parseDroneFromData(effectiveDroneData);
  if (!drone && previousDroneData) {
    drone = parseDroneFromData(previousDroneData);
  }

  // Show loading only during initial load (first time), not during refetch
  if ((orderLoading || (droneLoading && !effectiveDroneData)) && !drone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Handle error case - drone not found or error loading (only after initial load is done)
  if (
    !droneLoading &&
    droneLoading !== undefined &&
    (!drone || !effectiveDroneData || effectiveDroneData.status === "error") &&
    !droneFetching
  ) {
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

  // Calculate distance and ETA safely with null checks (prefer deliveryDestination)
  const finalDestForInfo =
    (drone?.deliveryDestination &&
    typeof drone.deliveryDestination.latitude === "number" &&
    typeof drone.deliveryDestination.longitude === "number"
      ? drone.deliveryDestination
      : null) ||
    (drone?.destination &&
    typeof drone.destination.latitude === "number" &&
    typeof drone.destination.longitude === "number"
      ? drone.destination
      : null);

  const distanceToDestination =
    drone?.currentLocation && finalDestForInfo
      ? calculateDistance(
          drone.currentLocation.latitude || 0,
          drone.currentLocation.longitude || 0,
          finalDestForInfo.latitude || 0,
          finalDestForInfo.longitude || 0
        )
      : 0;

  const estimatedMinutes =
    drone?.speed && drone.speed > 0
      ? Math.round((distanceToDestination / drone.speed) * 60)
      : 0;

  // Final safety check before render
  // CRITICAL: Only show loading if we truly don't have drone data AND not fetching
  // During refetch/update, keep showing the page with previous data
  if (!drone || !drone.currentLocation) {
    // Only show loading if:
    // 1. Initial load (droneLoading = true and no previous data)
    // 2. Not currently fetching (not updating battery, etc.) AND no previous data
    if (droneLoading && !previousDroneData) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải thông tin drone...</p>
          </div>
        </div>
      );
    }

    // If we're fetching (updating battery), continue rendering with previous data
    // The map useEffect will handle displaying the previous drone data
    if (!droneFetching && !previousDroneData) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải thông tin drone...</p>
          </div>
        </div>
      );
    }

    // If we're here during refetch, continue rendering (drone will be null but map has previous data)
    // Use optional chaining in the render to prevent crashes
    if (!drone && !previousDroneData) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải thông tin drone...</p>
          </div>
        </div>
      );
    }

    // If we have previous data but current drone is null, use previous data for rendering
    // This prevents blank screen during refetch
    if (!drone && previousDroneData) {
      drone = parseDroneFromData(previousDroneData);
    }

    // Final check - if still no drone, show loading
    if (!drone || !drone.currentLocation) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải thông tin drone...</p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className={hideHeader ? "" : "min-h-screen bg-gray-50"}>
      {!hideHeader && <Breadcrumb items={breadcrumbItems} />}
      <div
        className={
          hideHeader ? "p-6" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        }
      >
        {/* Header */}
        {!hideHeader && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Theo dõi Drone Giao Hàng
              </h1>
              <p className="text-gray-600">
                Đơn hàng #{orderId?.slice(-8).toUpperCase()}
                {droneFetching && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Đang cập nhật...)
                  </span>
                )}
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
        )}

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
                  <p className="font-semibold text-gray-900">
                    {drone?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      drone?.status || "unknown"
                    )}`}
                  >
                    {getStatusText(drone?.status || "unknown")}
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
                          {parseFloat(drone?.batteryLevel || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow h-2 mb-4 flex rounded bg-gray-200">
                      <div
                        style={{
                          width: `${drone?.batteryLevel || 0}%`,
                        }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          parseFloat(drone?.batteryLevel || 0) > 50
                            ? "bg-green-500"
                            : parseFloat(drone?.batteryLevel || 0) > 20
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
                    {drone?.speed || 0} km/h
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
                {drone?.currentLocation && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Vị trí hiện tại
                    </p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {drone.currentLocation.latitude?.toFixed(6) || "N/A"},
                      {drone.currentLocation.longitude?.toFixed(6) || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Độ cao: {drone.currentLocation.altitude || 0}m
                    </p>
                  </div>
                )}
                {finalDestForInfo && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Điểm đến</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {finalDestForInfo.address || "Địa chỉ giao hàng"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {finalDestForInfo.latitude?.toFixed(6) || "N/A"},
                      {finalDestForInfo.longitude?.toFixed(6) || "N/A"}
                    </p>
                  </div>
                )}
                {drone?.startLocation && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Nhà hàng</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {drone.startLocation.restaurantName || "Nhà hàng"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {drone.startLocation.address || "Địa chỉ nhà hàng"}
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
