import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductItem from "./ProductItem";
import slugify from "slugify";
import Pagination from "react-js-pagination";
import ModalAdvanced from "../../components/Modal/ModalAdvanced";
import { useEffect } from "react";
import { formatPrice } from "../../utils/formatPrice";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";

const ProductList = ({ data, handlePageClick, page, totalPage }) => {
  const navigate = useNavigate();
  const bodyStyle = document.body.style;
  const [showModal, setShowModal] = useState(false);

  const handleClick = (item) => {
    const path = slugify(item.title, { strict: true });
    navigate(`/${path}/${item._id}`);
  };
  const [selectedItems, setSelectedItems] = useState([]);

  const addToCompare = (item) => {
    setSelectedItems((selectedItems) => [...selectedItems, item]);
  };

  useEffect(() => {
    if (selectedItems.length === 2) {
      setShowModal(true);
    }
  }, [selectedItems]);

  useEffect(() => {
    if (showModal === true) {
      disableBodyScroll(bodyStyle);
    } else {
      enableBodyScroll(bodyStyle);
    }
  }, [showModal]);

  const removeFromCompare = (item) => {
    const filteredItems = selectedItems.filter(
      (product) => product.id !== item.id
    );
    setSelectedItems((selectedItems) => filteredItems);
  };

  return (
    <>
      <div className="mt-20">
        <div className="flex flex-col container rounded-lg bg-white ">
          <div className="flex items-center justify-between p-5 ">
            <span className="font-bold text-xl">Đồ ăn nổi bật</span>
            <div className="flex items-center gap-x-1 cursor-pointer">
              <span
                className="text-base text-[#a497a2] font-semibold "
                onClick={() => navigate("/product")}
              >
                Xem tất cả
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </div>
          </div>
          <div className="grid-cols-5 grid gap-y-2 pb-10 items-stretch">
            {data.length > 0 &&
              data.map((item, index) => (
                <ProductItem
                  product={item}
                  onClickItem={() => handleClick(item)}
                  key={index}
                  className="border-2 border-solid border-[#f6f6f6]"
                  selected={selectedItems}
                  addToCompare={addToCompare}
                  removeFromCompare={removeFromCompare}
                />
              ))}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <Pagination
            activePage={page}
            nextPageText={">"}
            prevPageText={"<"}
            totalItemsCount={totalPage}
            itemsCountPerPage={1}
            firstPageText={"<<"}
            lastPageText={">>"}
            linkClass="page-num"
            onChange={handlePageClick}
          />
        </div>
      </div>
      {selectedItems.length === 2 && (
        <div>
          <ModalAdvanced
            visible={showModal}
            onClose={() => {
              setShowModal(false);
              setSelectedItems([]);
            }}
            bodyClassName="w-[1050px] bg-white rounded-lg relative z-10 content  overflow-hidden "
          >
            <div className="overflow-y-auto h-[600px] p-10">
              {/* Filter Options */}
              <div className="mb-6 flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Lọc theo:</label>
                  <select
                    className="px-3 py-1 border rounded text-sm"
                    onChange={(e) => {
                      const filterType = e.target.value;
                      // Logic filter sẽ được thêm sau
                      console.log("Filter by:", filterType);
                    }}
                  >
                    <option value="">Tất cả</option>
                    <option value="price">Giá</option>
                    <option value="brand">Thương hiệu</option>
                    <option value="category">Danh mục</option>
                    <option value="rating">Đánh giá</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Sắp xếp:</label>
                  <select
                    className="px-3 py-1 border rounded text-sm"
                    onChange={(e) => {
                      const sortType = e.target.value;
                      console.log("Sort by:", sortType);
                    }}
                  >
                    <option value="default">Mặc định</option>
                    <option value="price-low">Giá thấp → cao</option>
                    <option value="price-high">Giá cao → thấp</option>
                    <option value="rating">Đánh giá cao</option>
                    <option value="name">Tên A → Z</option>
                  </select>
                </div>
              </div>

              <table className="table-product items-center table-fixed w-full">
                <thead>
                  <tr>
                    <th></th>
                    <th className="text-base font-semibold items-start">
                      Sản phẩm 1
                    </th>
                    <th className="text-base font-semibold">Sản phẩm 2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-base font-semibold">Ảnh sản phẩm</td>
                    <td>
                      <img
                        src={selectedItems[0]?.images[0]}
                        alt=""
                        className="w-[200px] h-[200px] object-cover mx-auto"
                      />
                    </td>
                    <td>
                      <img
                        src={selectedItems[1]?.images[0]}
                        alt=""
                        className="w-[200px] h-[200px] object-cover mx-auto"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">Tên sản phẩm</td>
                    <td>
                      <span
                        className="text-base font-normal line-clamp-2 cursor-pointer"
                        title={selectedItems[0]?.title}
                      >
                        {selectedItems[0]?.title}
                      </span>
                    </td>
                    <td>
                      <span
                        className="text-base font-normal line-clamp-2 cursor-pointer"
                        title={selectedItems[1]?.title}
                      >
                        {selectedItems[1]?.title}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">Thương hiệu</td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[0]?.brand?.name || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[1]?.brand?.name || "N/A"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">Danh mục</td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[0]?.category?.name || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[1]?.category?.name || "N/A"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">Màu sắc</td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[0]?.color || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[1]?.color || "N/A"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">Kích thước</td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[0]?.size || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[1]?.size || "N/A"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">Thành phần</td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[0]?.ingredients || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[1]?.ingredients || "N/A"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">Xuất xứ</td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[0]?.origin || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[1]?.origin || "N/A"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">Hạn sử dụng</td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[0]?.shelfLife || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[1]?.shelfLife || "N/A"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">Nhu cầu</td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[0]?.demand || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[1]?.demand || "N/A"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">Giá gốc</td>
                    <td>
                      <span className="text-base font-normal">
                        {formatPrice(selectedItems[0]?.price)}
                      </span>
                    </td>
                    <td>
                      <span className="text-base font-normal">
                        {formatPrice(selectedItems[1]?.price)}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">Giá khuyến mãi</td>
                    <td>
                      <span className="text-base font-normal text-red-600 font-semibold">
                        {formatPrice(selectedItems[0]?.promotion)}
                      </span>
                    </td>
                    <td>
                      <span className="text-base font-normal text-red-600 font-semibold">
                        {formatPrice(selectedItems[1]?.promotion)}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">Đánh giá</td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[0]?.ratingsAverage || "N/A"} ⭐
                      </span>
                    </td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[1]?.ratingsAverage || "N/A"} ⭐
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">
                      Số lượng đánh giá
                    </td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[0]?.ratingsQuantity || 0}
                      </span>
                    </td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[1]?.ratingsQuantity || 0}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-base font-semibold">Trọng lượng</td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[0]?.weight
                          ? `${selectedItems[0]?.weight}g`
                          : "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="text-base font-normal">
                        {selectedItems[1]?.weight
                          ? `${selectedItems[1]?.weight}g`
                          : "N/A"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ModalAdvanced>
        </div>
      )}
    </>
  );
};

export default ProductList;
