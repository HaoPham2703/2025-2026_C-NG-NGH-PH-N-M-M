import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productApi } from '../api/productApi';
import { Star, ShoppingCart, Heart, Share2 } from 'lucide-react';
import { useState } from 'react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useQuery(
    ['product', id],
    () => productApi.getProduct(id),
    {
      refetchOnWindowFocus: false,
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !product?.data?.product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sản phẩm không tồn tại</h2>
          <p className="text-gray-600">Vui lòng thử lại sau</p>
        </div>
      </div>
    );
  }

  const productData = product.data.product;
  const maxQuantity = Math.min(productData.inventory || 0, 10);

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', { productId: id, quantity });
  };

  const handleBuyNow = () => {
    // TODO: Implement buy now functionality
    console.log('Buy now:', { productId: id, quantity });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                {productData.images?.[selectedImageIndex] ? (
                  <img
                    src={productData.images[selectedImageIndex]}
                    alt={productData.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              
              {productData.images?.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {productData.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square bg-gray-200 rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index ? 'border-primary-600' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${productData.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {productData.title}
                </h1>
                
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(productData.ratingsAverage || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    {productData.ratingsAverage?.toFixed(1) || '0.0'} ({productData.ratingsQuantity || 0} đánh giá)
                  </span>
                </div>

                <div className="flex items-center space-x-4 mb-6">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
                    <Heart className="w-5 h-5" />
                    <span>Yêu thích</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
                    <Share2 className="w-5 h-5" />
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="border-t pt-6">
                <div className="flex items-center space-x-4 mb-4">
                  {productData.promotion ? (
                    <>
                      <span className="text-3xl font-bold text-primary-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(productData.promotion)}
                      </span>
                      <span className="text-xl text-gray-500 line-through">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(productData.price)}
                      </span>
                      <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                        -{Math.round(((productData.price - productData.promotion) / productData.price) * 100)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-primary-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(productData.price)}
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 mb-6">
                  <p>Còn lại: <span className="font-medium">{productData.inventory || 0} sản phẩm</span></p>
                </div>
              </div>

              {/* Quantity and Actions */}
              <div className="border-t pt-6">
                <div className="flex items-center space-x-4 mb-6">
                  <label className="text-sm font-medium text-gray-700">Số lượng:</label>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
                      className="w-16 text-center border-0 focus:ring-0"
                      min="1"
                      max={maxQuantity}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      className="px-3 py-2 hover:bg-gray-100 transition-colors"
                      disabled={quantity >= maxQuantity}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 btn-secondary flex items-center justify-center"
                    disabled={productData.inventory === 0}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Thêm vào giỏ
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 btn-primary"
                    disabled={productData.inventory === 0}
                  >
                    Mua ngay
                  </button>
                </div>
              </div>

              {/* Product Details */}
              {productData.description && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Mô tả sản phẩm</h3>
                  <div className="text-gray-600 prose max-w-none">
                    <p>{productData.description}</p>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Thông tin thêm</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {productData.origin && (
                    <div>
                      <span className="font-medium">Xuất xứ:</span>
                      <span className="ml-2 text-gray-600">{productData.origin}</span>
                    </div>
                  )}
                  {productData.weight && (
                    <div>
                      <span className="font-medium">Trọng lượng:</span>
                      <span className="ml-2 text-gray-600">{productData.weight}g</span>
                    </div>
                  )}
                  {productData.calories && (
                    <div>
                      <span className="font-medium">Calories:</span>
                      <span className="ml-2 text-gray-600">{productData.calories} cal</span>
                    </div>
                  )}
                  {productData.shelfLife && (
                    <div>
                      <span className="font-medium">Hạn sử dụng:</span>
                      <span className="ml-2 text-gray-600">{productData.shelfLife}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
