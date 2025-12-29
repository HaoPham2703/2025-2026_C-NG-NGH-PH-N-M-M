import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import vietnamAddress from "../../../data_demo/vietnamAddress.json";

const AddressAutocomplete = ({ 
  type = "province", // "province", "district", "ward"
  value = "",
  onChange,
  placeholder = "",
  selectedProvince = null,
  selectedDistrict = null,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Cập nhật searchTerm khi value thay đổi từ bên ngoài
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Đóng suggestions khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hàm tìm kiếm địa chỉ theo loại
  const searchAddress = (term) => {
    if (!term || term.length < 1) {
      setSuggestions([]);
      return;
    }

    const results = [];
    const searchLower = term.toLowerCase().trim();

    if (type === "province") {
      // Tìm kiếm tỉnh/thành phố
      vietnamAddress.forEach((province) => {
        if (province.Name.toLowerCase().includes(searchLower)) {
          results.push({
            value: province.Name,
            label: province.Name,
            data: province
          });
        }
      });
    } else if (type === "district" && selectedProvince) {
      // Tìm kiếm quận/huyện theo tỉnh đã chọn
      const province = vietnamAddress.find(p => p.Name === selectedProvince);
      if (province) {
        province.Districts.forEach((district) => {
          if (district.Name.toLowerCase().includes(searchLower)) {
            results.push({
              value: district.Name,
              label: district.Name,
              data: district
            });
          }
        });
      }
    } else if (type === "ward" && selectedProvince && selectedDistrict) {
      // Tìm kiếm phường/xã theo quận đã chọn
      const province = vietnamAddress.find(p => p.Name === selectedProvince);
      if (province) {
        const district = province.Districts.find(d => d.Name === selectedDistrict);
        if (district && district.Wards) {
          district.Wards.forEach((ward) => {
            if (ward.Name.toLowerCase().includes(searchLower)) {
              results.push({
                value: ward.Name,
                label: ward.Name,
                data: ward
              });
            }
          });
        }
      }
    }

    // Giới hạn số lượng kết quả
    setSuggestions(results.slice(0, 10));
  };

  // Xử lý khi người dùng gõ
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchAddress(value);
    setShowSuggestions(true);
    onChange(value);
  };

  // Xử lý khi chọn một gợi ý
  const handleSelectSuggestion = (suggestion) => {
    setSearchTerm(suggestion.value);
    setShowSuggestions(false);
    onChange(suggestion.value);
  };

  // Xử lý khi focus vào input
  const handleFocus = () => {
    if (searchTerm.length >= 0) {
      searchAddress(searchTerm);
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>

      {/* Dropdown suggestions */}
      {showSuggestions && suggestions.length > 0 && !disabled && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="px-4 py-2.5 hover:bg-primary-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
            >
              <p className="text-sm text-gray-900">{suggestion.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hiển thị thông báo khi không có kết quả */}
      {showSuggestions && searchTerm.length >= 1 && suggestions.length === 0 && !disabled && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
        >
          <p className="text-sm text-gray-500 text-center">
            Không tìm thấy kết quả
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
