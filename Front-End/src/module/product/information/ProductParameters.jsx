import React from "react";

const ProductParameters = ({ data }) => {
  return (
    <div className="product-parameters px-5 pb-10">
      <div className="text-2xl font-semibold mb-8">🍽️ Thông tin dinh dưỡng</div>
      <table className="table-product">
        <thead>
          <tr>
            <td>Thương hiệu</td>
            <td>{data?.brand?.name}</td>
          </tr>
          <tr>
            <td>Xuất xứ</td>
            <td>{data?.origin}</td>
          </tr>
          <tr>
            <td>Thành phần</td>
            <td>{data?.ingredients}</td>
          </tr>
          <tr>
            <td>Trọng lượng</td>
            <td>{data?.weight} kg</td>
          </tr>
          <tr>
            <td>Hạn sử dụng</td>
            <td>{data?.shelfLife}</td>
          </tr>
          <tr>
            <td>Bảo quản</td>
            <td>{data?.storage}</td>
          </tr>
          <tr>
            <td>Calories</td>
            <td>{data?.calories} kcal</td>
          </tr>
          <tr>
            <td>Dinh dưỡng</td>
            <td>{data?.nutrition}</td>
          </tr>
          <tr>
            <td>Dị ứng</td>
            <td>{data?.allergen || "Không có"}</td>
          </tr>
          <tr>
            <td>Phù hợp</td>
            <td>{data?.demand}</td>
          </tr>
        </thead>
      </table>
    </div>
  );
};

export default ProductParameters;
