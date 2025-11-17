import React from 'react';
import { Star } from 'lucide-react';

/**
 * RatingStars Component
 * Hiển thị hoặc cho phép chọn rating với stars
 * 
 * @param {Object} props
 * @param {number} props.value - Giá trị rating (1-5)
 * @param {function} props.onChange - Callback khi rating thay đổi (optional)
 * @param {boolean} props.readonly - Chỉ hiển thị, không cho chỉnh sửa
 * @param {string} props.size - Kích thước: 'small', 'medium', 'large'
 * @param {boolean} props.showValue - Hiển thị số rating bên cạnh
 */
const RatingStars = ({ 
  value = 0, 
  onChange = null, 
  readonly = false, 
  size = 'medium',
  showValue = false 
}) => {
  const [hoverValue, setHoverValue] = React.useState(0);

  // Xác định kích thước icon
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 28
  };
  const iconSize = sizeMap[size] || sizeMap.medium;

  // Xác định class cho container
  const containerClass = readonly ? 'inline-flex items-center' : 'inline-flex items-center cursor-pointer';

  const handleClick = (rating) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(0);
    }
  };

  // Xác định rating để hiển thị (hover hoặc actual)
  const displayValue = hoverValue || value;

  return (
    <div className={containerClass}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const isFilled = rating <= displayValue;
        
        return (
          <Star
            key={rating}
            size={iconSize}
            className={`
              ${isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              ${!readonly ? 'hover:scale-110 transition-transform' : ''}
              ${size === 'small' ? 'mx-0.5' : 'mx-1'}
            `}
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}
      
      {showValue && (
        <span className={`
          ml-2 font-semibold
          ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'}
        `}>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
