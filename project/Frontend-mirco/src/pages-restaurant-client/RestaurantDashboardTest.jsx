import React from "react";

const RestaurantDashboardTest = () => {
  const token = localStorage.getItem("restaurant_token");
  const restaurantData = localStorage.getItem("restaurant_data");

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Restaurant Dashboard Test
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <div className="space-y-2">
            <p>
              <strong>Token exists:</strong> {token ? "Yes" : "No"}
            </p>
            <p>
              <strong>Token:</strong>{" "}
              {token ? token.substring(0, 50) + "..." : "None"}
            </p>
            <p>
              <strong>Restaurant Data:</strong> {restaurantData || "None"}
            </p>
            <p>
              <strong>Current URL:</strong> {window.location.href}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-x-4">
            <a
              href="/restaurant/login"
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            >
              Go to Login
            </a>
            <a
              href="/restaurant/signup"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Signup
            </a>
            <button
              onClick={() => {
                localStorage.removeItem("restaurant_token");
                localStorage.removeItem("restaurant_data");
                window.location.reload();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Clear Storage & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboardTest;
