const axios = require("axios");

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Geocode an address string to latitude/longitude coordinates
 * Uses OpenStreetMap Nominatim API with fallback
 */
async function geocodeAddress(address) {
  try {
    const encodedAddress = encodeURIComponent(
      address + ", Ho Chi Minh City, Vietnam"
    );
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          "User-Agent": "Order-Service/1.0",
        },
        timeout: 5000,
      }
    );

    if (response.data && response.data.length > 0) {
      return {
        latitude: parseFloat(response.data[0].lat),
        longitude: parseFloat(response.data[0].lon),
      };
    }

    // Fallback to simulated coordinates for Ho Chi Minh City
    return generateSimulatedCoordinates(address);
  } catch (error) {
    console.error("Geocoding error, using simulated coordinates:", error.message);
    return generateSimulatedCoordinates(address);
  }
}

/**
 * Generate simulated coordinates within Ho Chi Minh City bounds
 */
function generateSimulatedCoordinates(address) {
  const latBase = 10.7769; // City center
  const lonBase = 106.7009;

  // Generate consistent coordinates based on address hash
  const addressHash = hashString(address);
  const latVariation = ((addressHash % 400) - 200) / 10000;
  const lonVariation = ((addressHash % 400) - 200) / 10000;

  return {
    latitude: parseFloat((latBase + latVariation).toFixed(6)),
    longitude: parseFloat((lonBase + lonVariation).toFixed(6)),
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Calculate shipping fee based on distance
 * Pricing: 20,000 VND per kilometer
 * Minimum charge: 20,000 VND (for distances < 1km)
 * Distance is rounded up to the nearest kilometer
 */
function calculateShippingFee(distance) {
  // Minimum charge for distances less than 1km
  if (distance < 1) {
    return 20000;
  }
  
  // Round up to nearest kilometer and multiply by 20,000 VND
  const distanceInKm = Math.ceil(distance);
  return distanceInKm * 20000;
}

/**
 * Calculate shipping fee based on restaurant address and delivery address
 * @param {String} restaurantAddress - Restaurant address
 * @param {String} deliveryAddress - Delivery address (full address string or structured address)
 * @returns {Promise<Number>} Shipping fee in VND
 */
async function calculateShippingFeeByAddress(restaurantAddress, deliveryAddress) {
  try {
    // Convert delivery address to string if it's an object
    let deliveryAddressStr = deliveryAddress;
    if (typeof deliveryAddress === "object" && deliveryAddress !== null) {
      // Handle structured address format
      if (deliveryAddress.detail && deliveryAddress.ward && deliveryAddress.district && deliveryAddress.province) {
        deliveryAddressStr = `${deliveryAddress.detail}, ${deliveryAddress.ward}, ${deliveryAddress.district}, ${deliveryAddress.province}`;
      } else if (deliveryAddress.address) {
        deliveryAddressStr = deliveryAddress.address;
      } else {
        deliveryAddressStr = JSON.stringify(deliveryAddress);
      }
    }

    // Geocode both addresses
    const [restaurantCoords, deliveryCoords] = await Promise.all([
      geocodeAddress(restaurantAddress),
      geocodeAddress(deliveryAddressStr),
    ]);

    // Calculate distance
    const distance = calculateDistance(
      restaurantCoords.latitude,
      restaurantCoords.longitude,
      deliveryCoords.latitude,
      deliveryCoords.longitude
    );

    // Calculate shipping fee
    const shippingFee = calculateShippingFee(distance);

    console.log(`[Shipping Fee] Distance: ${distance.toFixed(2)}km, Fee: ${shippingFee} VND`);

    return shippingFee;
  } catch (error) {
    console.error("[Shipping Fee] Error calculating shipping fee:", error.message);
    // Return default fee if calculation fails
    return 20000; // Default fee
  }
}

module.exports = {
  calculateShippingFeeByAddress,
  calculateShippingFee,
  calculateDistance,
  geocodeAddress,
};

