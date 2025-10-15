import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="text-black bg-white mt-5 ">
      <div className="container">
        <div className="flex items-start justify-between pt-8">
          <div className="flex flex-col">
            <span className="text-lg font-semibold">Tải ứng dụng</span>
            <div className="flex items-center mt-5">
              <Link to={"/"} className="mr-3">
                <img src="/images/googleplay.png" alt="" />
              </Link>
              <Link to={"/"}>
                <img src="/images/appstore.png" alt="" />
              </Link>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold">Hỗ trợ</span>
            <div className="mt-5 flex-col flex">
              <Link to={"/"} className="pb-3 text-base hover:text-blue-600 ">
                <span>Trung tâm hỗ trợ </span>
              </Link>
              <Link to={"/"} className="pb-3 text-base  hover:text-blue-600">
                <span>Theo dõi đơn hàng của bạn </span>
              </Link>
              <Link to={"/"} className="pb-3 text-base  hover:text-blue-600">
                <span>Tài khoản của bạn </span>
              </Link>
              <Link to={"/"} className="pb-3 text-base  hover:text-blue-600">
                <span>Liên hệ chúng tôi </span>
              </Link>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold">Hỗ trợ</span>
            <div className="mt-5 flex-col flex">
              <Link to={"/"} className="pb-3 text-base hover:text-blue-600 ">
                <span>Công ty </span>
              </Link>
              <Link to={"/"} className="pb-3 text-base  hover:text-blue-600">
                <span>Về chúng tôi </span>
              </Link>
              <Link to={"/"} className="pb-3 text-base  hover:text-blue-600">
                <span>Tin tức & Bài báo</span>
              </Link>
              <Link to={"/"} className="pb-3 text-base  hover:text-blue-600">
                <span>Thông báo pháp lý</span>
              </Link>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold">Quan hệ đối tác</span>
            <div className="mt-5 flex-col flex">
              <Link to={"/"} className="pb-3 text-base hover:text-blue-600 ">
                <span>Trung tâm trợ giúp </span>
              </Link>
              <Link to={"/"} className="pb-3 text-base  hover:text-blue-600">
                <span>Theo dõi đơn hàng của bạn </span>
              </Link>
              <Link to={"/"} className="pb-3 text-base  hover:text-blue-600">
                <span>Tài khoản của bạn </span>
              </Link>
              <Link to={"/"} className="pb-3 text-base  hover:text-blue-600">
                <span>Liên hệ chúng tôi </span>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-[100px] h-[100px]">
            <img
              src="/images/logo.png"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-2xl font-bold">🍽️ FOOD.VN</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
