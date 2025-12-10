import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Link, useNavigate } from "react-router-dom";
import { droneApi } from "../api/droneApi";
import { orderApi } from "../api/orderApi";
import { useAuth } from "../hooks/useAuth";
import {
  Navigation,
  Battery,
  MapPin,
  Package,
  Activity,
  Plus,
  RefreshCw,
  ArrowLeft,
  Loader,
  Play,
  Pause,
  RotateCcw,
  LogOut,
  Shield,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

const DroneHubPage = ({ hideHeader = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [map, setMap] = useState(null);
  const mapRef = useRef(null);
  const [modalMap, setModalMap] = useState(null);
  const modalMapRef = useRef(null); // Map trong modal
  const modalMarkersRef = useRef({}); // Markers của drones hiện có trên modal map
  const markersRef = useRef({});
  const startLocationMarkersRef = useRef({});
  const destinationMarkersRef = useRef({});
  const pathLinesRef = useRef({});
  const initialBoundsSetRef = useRef(false); // Track if initial bounds have been set
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewMarker, setPreviewMarker] = useState(null);
  const [clickToPlace, setClickToPlace] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignOrderId, setAssignOrderId] = useState("");
  const [assignMode, setAssignMode] = useState("list"); // "list" or "manual"
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false); // Toggle auto-assign
  const assignedOrdersRef = useRef(new Set()); // Track orders that have been auto-assigned
  const isAutoAssigningRef = useRef(false); // Track if auto-assign is currently processing
  const failedOrdersRef = useRef(new Map()); // Track failed orders with timestamp: Map<orderId, timestamp>
  const lastAssignTimeRef = useRef(0); // Track last assignment time to prevent too frequent attempts

  const queryClient = useQueryClient();

  // Check admin role - redirect if not admin (only when not used in dashboard)
  useEffect(() => {
    if (!hideHeader) {
      if (user && user.role !== "admin") {
        toast.error("Bạn không có quyền truy cập trang này!");
        navigate("/");
      } else if (!user) {
        navigate("/login");
      }
    }
  }, [user, navigate, hideHeader]);

  // Fetch orders that need drone delivery (only "Đang giao" - Delivery status)
  // QUAN TRỌNG: Luôn fetch từ database, không dùng cache để đảm bảo dữ liệu mới nhất
  const {
    data: pendingOrders,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery(
    ["pendingOrdersForDrone", showAssignModal], // Thêm showAssignModal vào query key để force refetch
    () => {
      console.log(
        "[DroneHubPage] 🔄 Fetching orders from DATABASE (no cache)..."
      );
      // Suppress toast for order fetching - failures can be handled gracefully
      return orderApi.getOrders({ suppressToast: true });
    },
    {
      enabled: showAssignModal, // Only fetch when modal is open
      // Disable cache để luôn fetch từ database
      staleTime: 0, // Dữ liệu luôn được coi là cũ, phải fetch mới
      cacheTime: 0, // Không cache dữ liệu
      refetchOnMount: true, // Luôn refetch khi component mount
      refetchOnWindowFocus: false, // Không refetch khi focus window
      refetchOnReconnect: false, // Không refetch khi reconnect
      select: (data) => {
        console.log("[DroneHubPage] Raw orders data:", data);

        // Handle different response structures
        const orders =
          data?.data?.orders || data?.data || data?.orders || data || [];
        console.log("[DroneHubPage] Total orders fetched:", orders.length);

        if (!Array.isArray(orders)) {
          console.error(
            "[DroneHubPage] Orders is not an array:",
            typeof orders,
            orders
          );
          return [];
        }

        // Filter orders that are in "Đang giao" status (Delivery) only
        const filtered = orders.filter((order) => {
          if (!order || !order.status) {
            console.warn("[DroneHubPage] Order missing status:", order);
            return false;
          }
          const isDelivery = order.status === "Delivery";
          return isDelivery;
        });

        console.log(
          "[DroneHubPage] Filtered orders (Delivery only):",
          filtered.length,
          "out of",
          orders.length
        );
        if (filtered.length === 0 && orders.length > 0) {
          const availableStatuses = [...new Set(orders.map((o) => o.status))];
          console.log(
            "[DroneHubPage] Available statuses in fetched orders:",
            availableStatuses
          );
          console.warn(
            "[DroneHubPage] No orders with 'Delivery' status found. Please check if:"
          );
          console.warn("  1. User has admin role to see all orders");
          console.warn(
            "  2. There are any orders with 'Delivery' status in the system"
          );
        }
        if (orders.length === 0) {
          console.warn(
            "[DroneHubPage] No orders fetched at all. This might mean:"
          );
          console.warn("  1. User is not admin and has no orders");
          console.warn("  2. API endpoint returned empty result");
        }

        // Sort by createdAt descending (newest first) or by _id if createdAt is not available
        const sorted = filtered.sort((a, b) => {
          // Try createdAt first (newest first)
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          // Fallback to _id (MongoDB ObjectId includes timestamp, newer IDs are larger)
          if (a._id && b._id) {
            return a._id > b._id ? -1 : 1;
          }
          return 0;
        });

        console.log("[DroneHubPage] Final sorted orders:", sorted.length);
        return sorted;
      },
      onError: (error) => {
        console.error("[DroneHubPage] Error fetching orders:", error);
        console.error("[DroneHubPage] Error details:", {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });
      },
    }
  );

  // Force refetch orders từ database khi mở modal gán đơn
  // Đảm bảo luôn lấy dữ liệu mới nhất, không dùng cache
  useEffect(() => {
    if (showAssignModal) {
      console.log(
        "[DroneHubPage] 🔄 Modal opened - Invalidating cache and refetching orders from DATABASE..."
      );
      // Invalidate cache để đảm bảo fetch từ database
      queryClient.invalidateQueries(["pendingOrdersForDrone"]);
      // Force refetch ngay lập tức
      refetchOrders();
    }
  }, [showAssignModal, queryClient, refetchOrders]);

  // check newDrone
  const [newDrone, setNewDrone] = useState({
    droneId: "",
    name: "",
    latitude: 10.7769,
    longitude: 106.7009,
    altitude: 50,
    speed: 40,
    batteryLevel: 100,
  });

  // Fetch all drones
  const {
    data: dronesData,
    isLoading,
    error,
    refetch,
  } = useQuery("drones", droneApi.getAllDrones, {
    refetchInterval: 5000, // Auto refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Handle different response structures
  const drones =
    dronesData?.data?.drones || dronesData?.data || dronesData || [];

  // Fetch orders for auto-assign (chạy định kỳ khi auto-assign bật)
  const { data: ordersForAutoAssign, refetch: refetchOrdersForAutoAssign } =
    useQuery(
      ["ordersForAutoAssign", autoAssignEnabled],
      () => {
        console.log("[DroneHubPage] 🔄 Fetching orders for auto-assign...");
        // Suppress toast for auto-assign polling - failures are not critical
        return orderApi.getOrders({ suppressToast: true });
      },
      {
        enabled: autoAssignEnabled, // Chỉ chạy khi auto-assign bật
        refetchInterval: autoAssignEnabled ? 10000 : false, // Poll mỗi 10 giây khi bật
        staleTime: 0,
        cacheTime: 0,
        select: (data) => {
          const orders =
            data?.data?.orders || data?.data || data?.orders || data || [];
          // Filter orders với status "Delivery" và chưa có drone được gán
          return orders.filter((order) => {
            if (!order || order.status !== "Delivery") return false;
            // Kiểm tra xem order đã có drone được gán chưa (kiểm tra trong danh sách drones)
            const hasDrone = drones.some(
              (drone) => drone.orderId === order._id
            );
            return !hasDrone;
          });
        },
        onError: (error) => {
          // Log error but don't show toast (already suppressed via suppressToast)
          console.warn(
            "[DroneHubPage] Error fetching orders for auto-assign (non-critical):",
            error.message
          );
        },
      }
    );

  // Initialize map
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = () => {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.L && document.querySelector('link[href*="leaflet"]')) {
          resolve();
          return;
        }

        // Load CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          link.integrity =
            "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
          link.crossOrigin = "";
          document.head.appendChild(link);
        }

        // Load JS
        if (!window.L) {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.integrity =
            "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
          script.crossOrigin = "";
          script.onload = () => {
            console.log("Leaflet loaded successfully");
            resolve();
          };
          script.onerror = () => {
            console.error("Failed to load Leaflet");
            reject(new Error("Failed to load Leaflet"));
          };
          document.head.appendChild(script);
        } else {
          resolve();
        }
      });
    };

    const initMap = () => {
      // Wait for DOM element to be ready
      const mapContainer = document.getElementById("drone-hub-map");
      if (!mapContainer) {
        console.warn("Map container not found, retrying...");
        setTimeout(initMap, 100);
        return;
      }

      if (!window.L) {
        console.warn("Leaflet not loaded yet, retrying...");
        setTimeout(initMap, 100);
        return;
      }

      if (mapRef.current) {
        console.log("Map already initialized");
        return;
      }

      try {
        // Default location (Ho Chi Minh City)
        const defaultLat = 10.7769;
        const defaultLon = 106.7009;

        console.log("Initializing map...");
        const mapInstance = window.L.map("drone-hub-map", {
          zoomControl: true,
        }).setView([defaultLat, defaultLon], 12);

        window.L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }
        ).addTo(mapInstance);

        // Fix Leaflet default marker icon issue
        delete window.L.Icon.Default.prototype._getIconUrl;
        window.L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        if (isMounted) {
          mapRef.current = mapInstance;
          setMap(mapInstance);
          console.log("Map initialized successfully");

          // Add click handler for placing drone
          mapInstance.on("click", (e) => {
            if (clickToPlace) {
              const { lat, lng } = e.latlng;
              setNewDrone((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
              }));

              // Remove existing preview marker
              if (previewMarker) {
                mapInstance.removeLayer(previewMarker);
              }

              // Add preview marker
              const marker = window.L.marker([lat, lng], {
                icon: window.L.divIcon({
                  className: "preview-drone-marker",
                  html: `<div style="background: #22c55e; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 20px; animation: pulse 2s infinite;">📍</div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                }),
              }).addTo(mapInstance);

              marker.bindPopup("Vị trí drone mới").openPopup();
              setPreviewMarker(marker);

              toast.success(
                `Đã chọn vị trí: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
              );
            }
          });
        } else {
          mapInstance.remove();
        }
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    // Start loading process
    loadLeaflet()
      .then(() => {
        // Small delay to ensure DOM is ready
        setTimeout(initMap, 100);
      })
      .catch((error) => {
        console.error("Failed to load Leaflet:", error);
        toast.error(
          "Không thể tải bản đồ. Vui lòng kiểm tra kết nối internet."
        );
      });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          console.error("Error removing map:", error);
        }
        mapRef.current = null;
        setMap(null);
      }
    };
  }, []);

  // Initialize map trong modal khi modal mở và clickToPlace = true
  useEffect(() => {
    if (!showCreateModal || !clickToPlace) {
      // Cleanup modal map khi đóng modal hoặc tắt clickToPlace
      if (modalMapRef.current) {
        try {
          // Xóa tất cả markers trên modal map
          Object.values(modalMarkersRef.current).forEach((marker) => {
            if (marker && modalMapRef.current.hasLayer(marker)) {
              modalMapRef.current.removeLayer(marker);
            }
          });
          modalMarkersRef.current = {};

          modalMapRef.current.remove();
          modalMapRef.current = null;
          setModalMap(null);
        } catch (error) {
          console.error("Error removing modal map:", error);
        }
      }
      return;
    }

    // Chờ DOM element sẵn sàng
    const initModalMap = () => {
      const mapContainer = document.getElementById("modal-drone-map");
      if (!mapContainer) {
        setTimeout(initModalMap, 100);
        return;
      }

      if (!window.L) {
        setTimeout(initModalMap, 100);
        return;
      }

      if (modalMapRef.current) {
        return; // Đã khởi tạo rồi
      }

      try {
        const defaultLat = newDrone.latitude || 10.7769;
        const defaultLon = newDrone.longitude || 106.7009;

        const mapInstance = window.L.map("modal-drone-map", {
          zoomControl: true,
        }).setView([defaultLat, defaultLon], 13);

        window.L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }
        ).addTo(mapInstance);

        // Fix Leaflet default marker icon issue
        delete window.L.Icon.Default.prototype._getIconUrl;
        window.L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        // Add click handler
        mapInstance.on("click", (e) => {
          const { lat, lng } = e.latlng;
          setNewDrone((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
          }));

          // Remove existing preview marker
          if (previewMarker && modalMapRef.current) {
            modalMapRef.current.removeLayer(previewMarker);
          }

          // Add preview marker
          const marker = window.L.marker([lat, lng], {
            icon: window.L.divIcon({
              className: "preview-drone-marker",
              html: `<div style="background: #22c55e; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 20px; animation: pulse 2s infinite;">📍</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            }),
          }).addTo(mapInstance);

          marker.bindPopup("Vị trí drone mới").openPopup();
          setPreviewMarker(marker);

          toast.success(`Đã chọn vị trí: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        });

        // Hiển thị các drone hiện có trên modal map
        if (drones && drones.length > 0) {
          drones.forEach((drone) => {
            if (
              drone.currentLocation &&
              drone.currentLocation.latitude &&
              drone.currentLocation.longitude
            ) {
              const iconColor = getStatusColorForMap(drone.status);
              const existingMarker = window.L.marker(
                [
                  drone.currentLocation.latitude,
                  drone.currentLocation.longitude,
                ],
                {
                  icon: window.L.divIcon({
                    className: "existing-drone-marker-modal",
                    html: `<div style="background: ${iconColor}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer;">🚁</div>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                  }),
                }
              ).addTo(mapInstance);

              const popupContent = `
                <div style="min-width: 180px; font-size: 12px;">
                  <b>${drone.name}</b><br/>
                  <small style="color: #666;">${drone.droneId}</small><br/>
                  <span style="color: ${iconColor}; font-weight: bold; font-size: 11px;">${getStatusText(
                drone.status
              )}</span><br/>
                  <small style="color: #888;">📍 ${drone.currentLocation.latitude.toFixed(
                    4
                  )}, ${drone.currentLocation.longitude.toFixed(4)}</small>
                </div>
              `;
              existingMarker.bindPopup(popupContent);
              modalMarkersRef.current[drone._id] = existingMarker;
            }
          });
        }

        modalMapRef.current = mapInstance;
        setModalMap(mapInstance);
        console.log(
          "Modal map initialized successfully with",
          Object.keys(modalMarkersRef.current).length,
          "existing drones"
        );
      } catch (error) {
        console.error("Error initializing modal map:", error);
      }
    };

    // Delay nhỏ để đảm bảo modal đã render
    setTimeout(initModalMap, 300);
  }, [
    showCreateModal,
    clickToPlace,
    newDrone.latitude,
    newDrone.longitude,
    previewMarker,
    drones,
  ]);

  // Update map markers when drones data changes
  useEffect(() => {
    if (!map) {
      console.log("Map not ready yet");
      return;
    }

    if (!drones.length) {
      console.log("No drones to display");
      return;
    }

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => {
      map.removeLayer(marker);
    });
    markersRef.current = {};

    // Clear existing destination markers
    Object.values(destinationMarkersRef.current).forEach((marker) => {
      if (marker && map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    destinationMarkersRef.current = {};

    // Clear existing start location markers (restaurants)
    Object.values(startLocationMarkersRef.current).forEach((marker) => {
      if (marker && map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    startLocationMarkersRef.current = {};

    // Clear existing path lines
    Object.values(pathLinesRef.current).forEach((line) => {
      if (line && map.hasLayer(line)) {
        map.removeLayer(line);
      }
    });
    pathLinesRef.current = {};

    // Add markers for each drone
    drones.forEach((drone) => {
      if (drone.currentLocation) {
        const iconColor = getStatusColorForMap(drone.status);
        const marker = window.L.marker(
          [drone.currentLocation.latitude, drone.currentLocation.longitude],
          {
            icon: window.L.divIcon({
              className: "drone-hub-marker",
              html: `<div style="background: ${iconColor}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer;">🚁</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            }),
          }
        ).addTo(map);

        const popupContent = `
          <div style="min-width: 200px;">
            <b>${drone.name}</b><br/>
            <small>${drone.droneId}</small><br/>
            <span style="color: ${iconColor}; font-weight: bold;">${getStatusText(
          drone.status
        )}</span><br/>
            <small>Pin: ${parseFloat(drone.batteryLevel).toFixed(2)}% | ${
          drone.speed
        } km/h</small>
            ${
              drone.orderId
                ? `<br/><small>Order: ${drone.orderId.slice(-8)}</small>`
                : ""
            }
          </div>
        `;
        marker.bindPopup(popupContent);

        marker.on("click", () => {
          setSelectedDrone(drone);
        });

        markersRef.current[drone._id] = marker;

        // Add start location marker (restaurant) if drone has one
        if (
          drone.startLocation &&
          typeof drone.startLocation.latitude === "number" &&
          typeof drone.startLocation.longitude === "number" &&
          !isNaN(drone.startLocation.latitude) &&
          !isNaN(drone.startLocation.longitude)
        ) {
          try {
            const startMarker = window.L.marker(
              [drone.startLocation.latitude, drone.startLocation.longitude],
              {
                icon: window.L.divIcon({
                  className: "start-marker-hub",
                  html: `<div style="background: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 12px;">🏪</div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                }),
              }
            ).addTo(map);

            startMarker.bindPopup(
              `<b>🏪 Nhà hàng</b><br/>${
                drone.startLocation.restaurantName || "Nhà hàng"
              }<br/><small>${
                drone.startLocation.address || "Địa chỉ nhà hàng"
              }</small><br/><small>${drone.startLocation.latitude.toFixed(
                6
              )}, ${drone.startLocation.longitude.toFixed(6)}</small>`
            );

            startLocationMarkersRef.current[drone._id] = startMarker;
          } catch (error) {
            console.error(
              `[DroneHubPage] Error adding start location marker for drone ${drone._id}:`,
              error
            );
          }
        }

        // Add final destination marker (prefer deliveryDestination over current destination)
        const finalDest =
          (drone.deliveryDestination &&
          typeof drone.deliveryDestination.latitude === "number" &&
          typeof drone.deliveryDestination.longitude === "number"
            ? drone.deliveryDestination
            : null) ||
          (drone.destination &&
          typeof drone.destination.latitude === "number" &&
          typeof drone.destination.longitude === "number" &&
          !isNaN(drone.destination.latitude) &&
          !isNaN(drone.destination.longitude)
            ? drone.destination
            : null);

        if (finalDest) {
          try {
            // Add destination marker
            const destMarker = window.L.marker(
              [finalDest.latitude, finalDest.longitude],
              {
                icon: window.L.divIcon({
                  className: "destination-marker-hub",
                  html: `<div style="background: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 12px;">📍</div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                }),
              }
            ).addTo(map);

            destMarker.bindPopup(
              `<b>📍 Điểm đến</b><br/>${
                finalDest.address || "Địa chỉ giao hàng"
              }<br/><small>Drone: ${
                drone.name
              }</small><br/><small>${finalDest.latitude.toFixed(
                6
              )}, ${finalDest.longitude.toFixed(6)}</small>`
            );

            destinationMarkersRef.current[drone._id] = destMarker;

            // Draw line: current -> (restaurant?) -> destination
            if (drone.currentLocation) {
              const points = [];
              points.push([
                drone.currentLocation.latitude,
                drone.currentLocation.longitude,
              ]);
              if (
                drone.startLocation &&
                typeof drone.startLocation.latitude === "number" &&
                typeof drone.startLocation.longitude === "number"
              ) {
                points.push([
                  drone.startLocation.latitude,
                  drone.startLocation.longitude,
                ]);
              }
              points.push([finalDest.latitude, finalDest.longitude]);

              const pathLine = window.L.polyline(points, {
                color: "#ef4444",
                weight: 2,
                opacity: 0.6,
                dashArray: "5, 10",
              }).addTo(map);

              pathLinesRef.current[drone._id] = pathLine;
            }
          } catch (error) {
            console.error(
              `[DroneHubPage] Error adding destination marker for drone ${drone._id}:`,
              error
            );
          }
        }
      }
    });

    // Fit map to show all drones and destinations (only on initial load or significant change)
    // Don't reset zoom on every update (especially battery updates)
    if (drones.length > 0) {
      const bounds = [];

      // Add drone positions
      drones
        .filter((d) => d.currentLocation)
        .forEach((d) => {
          bounds.push([
            d.currentLocation.latitude,
            d.currentLocation.longitude,
          ]);
        });

      // Add start (restaurant) positions
      drones
        .filter(
          (d) =>
            d.startLocation &&
            typeof d.startLocation.latitude === "number" &&
            typeof d.startLocation.longitude === "number"
        )
        .forEach((d) => {
          bounds.push([d.startLocation.latitude, d.startLocation.longitude]);
        });

      // Add final destination positions (prefer deliveryDestination)
      drones.forEach((d) => {
        const finalDest =
          (d.deliveryDestination &&
          typeof d.deliveryDestination.latitude === "number" &&
          typeof d.deliveryDestination.longitude === "number"
            ? d.deliveryDestination
            : null) ||
          (d.destination &&
          typeof d.destination.latitude === "number" &&
          typeof d.destination.longitude === "number"
            ? d.destination
            : null);
        if (finalDest) {
          bounds.push([finalDest.latitude, finalDest.longitude]);
        }
      });

      // Only fitBounds on initial load, not on every update
      if (bounds.length > 0 && !initialBoundsSetRef.current) {
        map.fitBounds(bounds, { padding: [50, 50] });
        initialBoundsSetRef.current = true;
      }
    }
  }, [map, drones]);

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

  const getStatusColorForMap = (status) => {
    const colorMap = {
      available: "#10b981", // green
      assigned: "#3b82f6", // blue
      flying: "#8b5cf6", // purple
      delivering: "#eab308", // yellow
      returning: "#6b7280", // gray
      maintenance: "#ef4444", // red
    };
    return colorMap[status] || "#6b7280";
  };

  const getBatteryColor = (level) => {
    if (level > 50) return "bg-green-500";
    if (level > 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  const filteredDrones = drones.filter((drone) => {
    if (selectedStatus === "all") return true;
    return drone.status === selectedStatus;
  });

  const statusCounts = {
    all: drones.length,
    available: drones.filter((d) => d.status === "available").length,
    assigned: drones.filter((d) => d.status === "assigned").length,
    flying: drones.filter((d) => d.status === "flying").length,
    delivering: drones.filter((d) => d.status === "delivering").length,
    returning: drones.filter((d) => d.status === "returning").length,
    maintenance: drones.filter((d) => d.status === "maintenance").length,
  };

  const updateStatusMutation = useMutation(
    ({ droneId, status }) => droneApi.updateDroneStatus(droneId, status),
    {
      onSuccess: () => {
        toast.success("Cập nhật trạng thái thành công!");
        queryClient.invalidateQueries("drones");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Cập nhật thất bại");
      },
    }
  );

  const handleUpdateStatus = (droneId, newStatus) => {
    updateStatusMutation.mutate({ droneId, status: newStatus });
  };

  // Create drone mutation
  const createDroneMutation = useMutation(
    (droneData) => droneApi.createDrone(droneData),
    {
      onSuccess: (response) => {
        toast.success("Tạo drone thành công!");
        // Remove preview marker(s)
        if (previewMarker) {
          if (map) {
            map.removeLayer(previewMarker);
          }
          if (modalMap) {
            modalMap.removeLayer(previewMarker);
          }
          setPreviewMarker(null);
        }
        setClickToPlace(false);

        // Reset form
        setNewDrone({
          droneId: "",
          name: "",
          latitude: 10.7769,
          longitude: 106.7009,
          altitude: 50,
          speed: 40,
          batteryLevel: 100,
        });

        setShowCreateModal(false);

        // Refetch drones list immediately and invalidate cache
        setTimeout(() => {
          refetch();
          queryClient.invalidateQueries("drones");
        }, 500);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Tạo drone thất bại");
      },
    }
  );

  const handleCreateDrone = (e) => {
    e.preventDefault();
    if (!newDrone.droneId || !newDrone.name) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    createDroneMutation.mutate({
      droneId: newDrone.droneId,
      name: newDrone.name,
      currentLocation: {
        latitude: parseFloat(newDrone.latitude),
        longitude: parseFloat(newDrone.longitude),
        altitude: parseFloat(newDrone.altitude),
      },
      speed: parseFloat(newDrone.speed) || 40,
      batteryLevel: parseFloat(newDrone.batteryLevel) || 100,
    });
  };

  const generateDroneId = () => {
    const count = drones.length + 1;
    const newId = `DRONE_${String(count).padStart(3, "0")}`;
    setNewDrone({ ...newDrone, droneId: newId });
  };

  // Assign drone to order mutation
  const assignDroneMutation = useMutation(
    (data) => droneApi.assignDroneToOrder(data),
    {
      onSuccess: () => {
        toast.success("Gán drone thành công!");
        queryClient.invalidateQueries("drones");
        setShowAssignModal(false);
        setAssignOrderId("");
        setAssignMode("list");
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || "Gán drone thất bại!");
      },
    }
  );

  // Auto-assign mutation (không hiện toast, chỉ log)
  const autoAssignMutation = useMutation(
    (data) => droneApi.assignDroneToOrder(data),
    {
      onSuccess: (response, variables) => {
        console.log(
          `[Auto-Assign] ✅ Tự động gán drone ${variables.droneId} cho đơn hàng ${variables.orderId}`
        );
        // Đánh dấu order đã được gán thành công
        assignedOrdersRef.current.add(variables.orderId);
        // Reset flag để có thể gán tiếp
        isAutoAssigningRef.current = false;
        queryClient.invalidateQueries("drones");
        queryClient.invalidateQueries("ordersForAutoAssign");
        // Hiện toast nhẹ nhàng
        toast.success(
          `✨ Đã tự động gán drone cho đơn hàng ${variables.orderId.slice(-8)}`,
          { duration: 3000 }
        );
      },
      onError: (error, variables) => {
        const errorMessage =
          error?.response?.data?.message || error.message || "Đã xảy ra lỗi";
        console.error(
          `[Auto-Assign] ❌ Lỗi khi tự động gán drone cho đơn hàng ${variables.orderId}:`,
          errorMessage
        );

        // Nếu lỗi do drone không available (flying, etc.), đánh dấu order để không thử lại ngay
        if (
          errorMessage.includes("trạng thái") ||
          errorMessage.includes("flying")
        ) {
          // Đánh dấu order này đã fail, đợi 30 giây trước khi thử lại
          failedOrdersRef.current.set(variables.orderId, Date.now());
          console.log(
            `[Auto-Assign] ⏸️ Đánh dấu order ${variables.orderId} để thử lại sau 30 giây`
          );
          // Không hiện toast để tránh spam
        } else {
          // Xóa order khỏi danh sách đã gán để có thể thử lại sau (lỗi khác)
          assignedOrdersRef.current.delete(variables.orderId);
        }

        // Reset flag để có thể thử lại
        isAutoAssigningRef.current = false;
        // Refresh drones để có dữ liệu mới nhất
        queryClient.invalidateQueries("drones");
      },
    }
  );

  // Logic tự động gán drone cho đơn hàng mới
  useEffect(() => {
    if (
      !autoAssignEnabled ||
      !ordersForAutoAssign ||
      ordersForAutoAssign.length === 0
    ) {
      return;
    }

    // Nếu đang xử lý auto-assign, không làm gì cả
    if (isAutoAssigningRef.current) {
      return;
    }

    // Chặn quá nhiều lần gán trong thời gian ngắn (ít nhất 2 giây giữa các lần)
    const now = Date.now();
    if (now - lastAssignTimeRef.current < 2000) {
      return;
    }

    // Lọc các đơn hàng chưa được gán và không bị fail gần đây
    const unassignedOrders = ordersForAutoAssign.filter((order) => {
      // Bỏ qua order đã được gán
      if (assignedOrdersRef.current.has(order._id)) {
        return false;
      }

      // Kiểm tra order có bị fail không (nếu có, đợi 30 giây trước khi thử lại)
      const failedTime = failedOrdersRef.current.get(order._id);
      if (failedTime) {
        const timeSinceFailed = now - failedTime;
        if (timeSinceFailed < 30000) {
          // Chưa đủ 30 giây, bỏ qua
          return false;
        } else {
          // Đã đủ 30 giây, xóa khỏi danh sách failed và thử lại
          failedOrdersRef.current.delete(order._id);
          console.log(
            `[Auto-Assign] 🔄 Thử lại order ${order._id} sau khi đợi 30 giây`
          );
        }
      }

      return true;
    });

    if (unassignedOrders.length === 0) {
      return;
    }

    // Lấy danh sách drone available (double-check)
    const availableDrones = drones.filter(
      (drone) => drone.status === "available"
    );

    if (availableDrones.length === 0) {
      console.log("[Auto-Assign] ⚠️ Không có drone available để gán");
      return;
    }

    // Chỉ gán một đơn hàng tại một thời điểm (lấy đơn hàng đầu tiên)
    const orderToAssign = unassignedOrders[0];
    const selectedDrone = availableDrones[0];

    // Double-check: Kiểm tra lại drone có còn available không
    if (selectedDrone.status !== "available") {
      console.log(
        `[Auto-Assign] ⚠️ Drone ${selectedDrone.droneId} không còn available (status: ${selectedDrone.status}), bỏ qua`
      );
      // Refresh drones để có dữ liệu mới
      queryClient.invalidateQueries("drones");
      return;
    }

    console.log(
      `[Auto-Assign] 🔄 Đang tự động gán drone ${selectedDrone.droneId} cho đơn hàng ${orderToAssign._id}...`
    );

    // Đánh dấu đang xử lý auto-assign
    isAutoAssigningRef.current = true;
    lastAssignTimeRef.current = now;

    // Đánh dấu order đang được xử lý (tránh gán trùng)
    assignedOrdersRef.current.add(orderToAssign._id);

    // Gán drone
    autoAssignMutation.mutate({
      droneId: selectedDrone.droneId,
      orderId: orderToAssign._id,
    });
  }, [
    autoAssignEnabled,
    ordersForAutoAssign,
    drones,
    autoAssignMutation,
    queryClient,
  ]);

  const handleAssignDrone = (e) => {
    e.preventDefault();
    if (!assignOrderId.trim()) {
      toast.error(
        assignMode === "list"
          ? "Vui lòng chọn một đơn hàng"
          : "Vui lòng nhập Order ID"
      );
      return;
    }
    if (!selectedDrone) {
      toast.error("Vui lòng chọn drone");
      return;
    }
    assignDroneMutation.mutate({
      droneId: selectedDrone.droneId,
      orderId: assignOrderId.trim(),
    });
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    setClickToPlace(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setClickToPlace(false);
    if (previewMarker && map) {
      map.removeLayer(previewMarker);
      setPreviewMarker(null);
    }
    // Clean up modal map
    if (modalMapRef.current) {
      try {
        modalMapRef.current.remove();
      } catch (error) {
        console.error("Error removing modal map:", error);
      }
      modalMapRef.current = null;
      setModalMap(null);
    }
  };

  // Show loading if checking auth or not admin (only when not used in dashboard)
  if (!hideHeader && (!user || user.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu drones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Lỗi tải dữ liệu
          </h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className={hideHeader ? "" : "min-h-screen bg-gray-50"}>
      {/* Simple Admin Header - No User Account Info (only show when not in dashboard) */}
      {!hideHeader && (
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary-600" />
                  <h1 className="text-xl font-bold text-gray-900">
                    🚁 Drone Hub - Điều Khiển
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại Admin
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      <div
        className={
          hideHeader ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        }
      >
        {/* Header Actions */}
        <div
          className={`mb-6 flex items-center ${
            hideHeader ? "justify-end" : "justify-between"
          }`}
        >
          {!hideHeader && (
            <div>
              <p className="text-gray-600">
                Quản lý và theo dõi tất cả drones của hệ thống
              </p>
            </div>
          )}
          <div className="flex items-center gap-3">
            {/* Auto-Assign Toggle */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Zap
                className={`w-4 h-4 ${
                  autoAssignEnabled ? "text-yellow-500" : "text-gray-400"
                }`}
              />
              <span className="text-sm font-medium text-gray-700">
                Tự động gán
              </span>
              <button
                onClick={() => {
                  const newValue = !autoAssignEnabled;
                  setAutoAssignEnabled(newValue);
                  if (newValue) {
                    toast.success("🔄 Bật tự động gán drone cho đơn hàng mới", {
                      duration: 3000,
                    });
                    // Clear tất cả tracking refs khi bật lại
                    assignedOrdersRef.current.clear();
                    failedOrdersRef.current.clear();
                    isAutoAssigningRef.current = false;
                    lastAssignTimeRef.current = 0;
                  } else {
                    toast.info("⏸️ Tắt tự động gán drone", { duration: 2000 });
                    // Clear tất cả tracking refs khi tắt
                    assignedOrdersRef.current.clear();
                    failedOrdersRef.current.clear();
                    isAutoAssigningRef.current = false;
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  autoAssignEnabled ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoAssignEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tạo Drone Mới
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`bg-white rounded-lg p-4 shadow-sm border-2 cursor-pointer transition-all ${
                selectedStatus === status
                  ? "border-primary-600 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-600 mt-1">
                {status === "all" ? "Tất cả" : getStatusText(status)}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  Bản Đồ Drones ({drones.length} drones)
                </h2>
              </div>
              <div
                id="drone-hub-map"
                className="w-full h-[600px] bg-gray-100"
                style={{ zIndex: 0 }}
              >
                {!map && (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Đang tải bản đồ...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drone List */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-md border border-gray-200">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary-600" />
                  Danh Sách Drones ({filteredDrones.length})
                </h2>
              </div>
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {filteredDrones.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Không có drone nào
                  </div>
                ) : (
                  filteredDrones.map((drone) => (
                    <div
                      key={drone._id}
                      onClick={() => {
                        setSelectedDrone(drone);
                        if (drone.currentLocation && map) {
                          map.setView(
                            [
                              drone.currentLocation.latitude,
                              drone.currentLocation.longitude,
                            ],
                            15
                          );
                        }
                      }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedDrone?._id === drone._id
                          ? "border-primary-600 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {drone.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {drone.droneId}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            drone.status
                          )}`}
                        >
                          {getStatusText(drone.status)}
                        </span>
                      </div>

                      <div className="space-y-2 mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            <Battery className="w-3 h-3" />
                            Pin
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getBatteryColor(
                                  drone.batteryLevel
                                )}`}
                                style={{ width: `${drone.batteryLevel}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                              {parseFloat(drone.batteryLevel).toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Tốc độ</span>
                          <span className="font-medium text-gray-900">
                            {drone.speed} km/h
                          </span>
                        </div>

                        {drone.currentLocation && (
                          <div className="text-xs text-gray-500">
                            📍 {drone.currentLocation.latitude.toFixed(4)},{" "}
                            {drone.currentLocation.longitude.toFixed(4)}
                          </div>
                        )}

                        {drone.orderId && (
                          <Link
                            to={`/drone-tracking/${drone.orderId}`}
                            className="block mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📦 Theo dõi đơn hàng →
                          </Link>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                        {drone.status === "available" && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrone(drone);
                                setShowAssignModal(true);
                              }}
                              className="flex-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-medium"
                            >
                              🎯 Gán đơn
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(drone._id, "maintenance");
                              }}
                              className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                            >
                              Bảo trì
                            </button>
                          </>
                        )}
                        {drone.status === "maintenance" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(drone._id, "available");
                            }}
                            className="flex-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                          >
                            Hoạt động
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Drone Details */}
        {selectedDrone && (
          <div className="mt-6 bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Chi Tiết: {selectedDrone.name}
              </h3>
              <button
                onClick={() => setSelectedDrone(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Thông Tin</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">ID:</span>{" "}
                    <span className="font-mono">{selectedDrone.droneId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Trạng thái:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded text-xs ${getStatusColor(
                        selectedDrone.status
                      )}`}
                    >
                      {getStatusText(selectedDrone.status)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pin:</span>{" "}
                    {parseFloat(selectedDrone.batteryLevel).toFixed(2)}%
                  </div>
                  <div>
                    <span className="text-gray-600">Tốc độ:</span>{" "}
                    {selectedDrone.speed} km/h
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Vị Trí</h4>
                {selectedDrone.currentLocation ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Lat:</span>{" "}
                      {selectedDrone.currentLocation.latitude.toFixed(6)}
                    </div>
                    <div>
                      <span className="text-gray-600">Lng:</span>{" "}
                      {selectedDrone.currentLocation.longitude.toFixed(6)}
                    </div>
                    <div>
                      <span className="text-gray-600">Độ cao:</span>{" "}
                      {selectedDrone.currentLocation.altitude}m
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Chưa có vị trí</div>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Đơn Hàng</h4>
                {selectedDrone.orderId ? (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Order ID:</span>{" "}
                      <span className="font-mono text-xs">
                        {selectedDrone.orderId}
                      </span>
                    </div>
                    <Link
                      to={`/drone-tracking/${selectedDrone.orderId}`}
                      className="inline-block px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                    >
                      Theo dõi đơn hàng
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-gray-500 text-sm mb-2">
                      Chưa có đơn hàng được gán
                    </div>
                    {selectedDrone.status === "available" && (
                      <button
                        onClick={() => {
                          setShowAssignModal(true);
                        }}
                        className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        🎯 Gán cho đơn hàng
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assign Drone Modal */}
        {showAssignModal && selectedDrone && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Gán Drone cho Đơn Hàng
                </h2>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssignOrderId("");
                    setAssignMode("list");
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAssignDrone} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drone được chọn
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="font-semibold text-gray-900">
                      {selectedDrone.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedDrone.droneId}
                    </div>
                  </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignMode("list");
                      setAssignOrderId("");
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      assignMode === "list"
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    📋 Chọn từ danh sách
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignMode("manual");
                      setAssignOrderId("");
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      assignMode === "manual"
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    ⌨️ Nhập thủ công
                  </button>
                </div>

                {assignMode === "list" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn đơn hàng cần gán{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    {ordersLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm">
                          Đang tải danh sách đơn hàng...
                        </p>
                      </div>
                    ) : ordersError ? (
                      <div className="text-center py-8 text-red-500 border border-red-200 rounded-lg bg-red-50">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">
                          Lỗi khi tải danh sách đơn hàng
                        </p>
                        <p className="text-xs mt-1 text-gray-600">
                          {ordersError?.message ||
                            "Vui lòng thử lại hoặc chuyển sang chế độ nhập thủ công"}
                        </p>
                        <button
                          onClick={() => {
                            queryClient.invalidateQueries(
                              "pendingOrdersForDrone"
                            );
                          }}
                          className="mt-3 px-4 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : !pendingOrders || pendingOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">
                          Không có đơn hàng đang ở trạng thái "Đang giao"
                        </p>
                        <p className="text-xs mt-1 text-gray-600">
                          Vui lòng chuyển sang chế độ nhập thủ công để gán đơn
                          hàng
                        </p>
                        <p className="text-xs mt-2 text-gray-500">
                          (Chỉ hiển thị đơn hàng có trạng thái "Delivery")
                        </p>
                      </div>
                    ) : (
                      <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                        {pendingOrders.map((order) => (
                          <div
                            key={order._id}
                            onClick={() => setAssignOrderId(order._id)}
                            className={`px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-primary-50 transition-colors ${
                              assignOrderId === order._id
                                ? "bg-primary-100 border-primary-300"
                                : ""
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-sm">
                                  {order.receiver || "Không có tên"}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  📞 {order.phone || "N/A"}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  📍 {order.address || "Không có địa chỉ"}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      order.status === "Delivery"
                                        ? "bg-purple-100 text-purple-800"
                                        : order.status === "Waiting Goods"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {order.status}
                                  </span>
                                  {order.total && (
                                    <span className="text-xs text-gray-600">
                                      💰{" "}
                                      {new Intl.NumberFormat("vi-VN").format(
                                        order.total
                                      )}{" "}
                                      đ
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-xs font-mono text-gray-400">
                                  {order._id.slice(-8)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={assignOrderId}
                      onChange={(e) => setAssignOrderId(e.target.value)}
                      placeholder="690863a9c35779c8bdd0774c"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Nhập ID của đơn hàng cần gán drone
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={assignDroneMutation.isLoading}
                    className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assignDroneMutation.isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Đang gán...
                      </span>
                    ) : (
                      "Gán Drone"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssignOrderId("");
                    }}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Drone Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Tạo Drone Mới
                  </h2>
                  {clickToPlace && (
                    <p className="text-sm text-green-600 mt-1">
                      💡 Click trên bản đồ để chọn vị trí
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCloseCreateModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateDrone} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drone ID <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDrone.droneId}
                      onChange={(e) =>
                        setNewDrone({ ...newDrone, droneId: e.target.value })
                      }
                      placeholder="DRONE_001"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateDroneId}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm whitespace-nowrap"
                    >
                      Tự động
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    ID duy nhất cho drone (ví dụ: DRONE_001)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên Drone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDrone.name}
                    onChange={(e) =>
                      setNewDrone({ ...newDrone, name: e.target.value })
                    }
                    placeholder="Drone Giao Hàng 1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Map trong modal để chọn tọa độ */}
                {clickToPlace && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-green-600 font-semibold">
                        💡 Click trên bản đồ bên dưới để chọn vị trí
                      </span>
                      {drones && drones.length > 0 && (
                        <span className="ml-2 text-xs text-gray-600">
                          (Hiển thị {drones.length} drone hiện có: 🚁)
                        </span>
                      )}
                    </label>
                    <div
                      id="modal-drone-map"
                      className="w-full h-[300px] bg-gray-100 rounded-lg border-2 border-green-300"
                      style={{ zIndex: 1 }}
                    >
                      {!modalMap && (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                            <p className="text-sm">Đang tải bản đồ...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Click vào bất kỳ đâu trên bản đồ để đặt vị trí drone mới
                      {drones && drones.length > 0 && (
                        <span className="ml-1">
                          • 🚁 = Drone hiện có (click để xem thông tin)
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      Vĩ độ (Latitude)
                      {clickToPlace && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          Click trên map
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newDrone.latitude}
                      onChange={(e) =>
                        setNewDrone({ ...newDrone, latitude: e.target.value })
                      }
                      placeholder="10.7769"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      readOnly={clickToPlace}
                      style={
                        clickToPlace
                          ? {
                              backgroundColor: "#f3f4f6",
                              cursor: "not-allowed",
                            }
                          : {}
                      }
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {clickToPlace
                        ? "Click trên bản đồ để tự động điền"
                        : "Mặc định: TP.HCM"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      Kinh độ (Longitude)
                      {clickToPlace && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          Click trên map
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newDrone.longitude}
                      onChange={(e) =>
                        setNewDrone({
                          ...newDrone,
                          longitude: e.target.value,
                        })
                      }
                      placeholder="106.7009"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      readOnly={clickToPlace}
                      style={
                        clickToPlace
                          ? {
                              backgroundColor: "#f3f4f6",
                              cursor: "not-allowed",
                            }
                          : {}
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Độ cao (m)
                    </label>
                    <input
                      type="number"
                      value={newDrone.altitude}
                      onChange={(e) =>
                        setNewDrone({ ...newDrone, altitude: e.target.value })
                      }
                      placeholder="50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tốc độ (km/h)
                    </label>
                    <input
                      type="number"
                      value={newDrone.speed}
                      onChange={(e) =>
                        setNewDrone({ ...newDrone, speed: e.target.value })
                      }
                      placeholder="40"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pin (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newDrone.batteryLevel}
                      onChange={(e) =>
                        setNewDrone({
                          ...newDrone,
                          batteryLevel: e.target.value,
                        })
                      }
                      placeholder="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={createDroneMutation.isLoading}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createDroneMutation.isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Đang tạo...
                      </span>
                    ) : (
                      "Tạo Drone"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseCreateModal}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClickToPlace(!clickToPlace);
                      if (!clickToPlace) {
                        toast.info("Click trên bản đồ để chọn vị trí", {
                          duration: 2000,
                        });
                      } else {
                        if (previewMarker) {
                          if (map) {
                            map.removeLayer(previewMarker);
                          }
                          if (modalMap) {
                            modalMap.removeLayer(previewMarker);
                          }
                          setPreviewMarker(null);
                        }
                      }
                    }}
                    className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                      clickToPlace
                        ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                        : "bg-blue-100 hover:bg-blue-200 text-blue-800"
                    }`}
                  >
                    {clickToPlace ? "✕ Hủy chọn vị trí" : "📍 Chọn trên map"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DroneHubPage;
