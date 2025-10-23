import React, { useState } from "react";
import axios from "axios";

const RestaurantLoginTest = () => {
  const [email, setEmail] = useState("test6@example.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post("/api/restaurant/login", {
        email,
        password,
      });

      // Store token and data
      localStorage.setItem("restaurant_token", response.data.token);
      localStorage.setItem(
        "restaurant_data",
        JSON.stringify(response.data.data.restaurant)
      );

      setResult({
        success: true,
        message: "Login successful!",
        token: response.data.token.substring(0, 50) + "...",
        restaurant: response.data.data.restaurant,
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = "/restaurant/dashboard";
      }, 2000);
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || error.message,
        error: error.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Restaurant Login Test
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        {result && (
          <div
            className={`mt-6 p-4 rounded-md ${
              result.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <h3 className="font-semibold mb-2">
              {result.success ? "Success!" : "Error"}
            </h3>
            <p className="text-sm">{result.message}</p>
            {result.success && (
              <div className="mt-2 text-xs">
                <p>
                  <strong>Token:</strong> {result.token}
                </p>
                <p>
                  <strong>Restaurant:</strong>{" "}
                  {result.restaurant?.restaurantName}
                </p>
              </div>
            )}
            {result.error && (
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(result.error, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <a
            href="/restaurant/test"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Go to Debug Page
          </a>
        </div>
      </div>
    </div>
  );
};

export default RestaurantLoginTest;
