import React from "react";

const ProductDescription = ({ data }) => {
  const html = data?.description;
  return (
    <div className="product-description">
      <div className="text-2xl font-semibold mb-8">🍴 Mô tả món ăn</div>
      <div dangerouslySetInnerHTML={{ __html: html }}></div>
      {data?.ingredients && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3">🥘 Thành phần chính:</h4>
          <p className="text-gray-700">{data.ingredients}</p>
        </div>
      )}
      {data?.nutrition && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3">📊 Thông tin dinh dưỡng:</h4>
          <p className="text-gray-700">{data.nutrition}</p>
        </div>
      )}
    </div>
  );
};

export default ProductDescription;
