import { Link } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";
import "../styles/Breadcrumb.css";

const Breadcrumb = ({ items }) => {
  return (
    <div className="breadcrumb-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center flex-wrap gap-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center">
              {index === 0 ? (
                <Link to={item.path} className="breadcrumb-item">
                  <Home className="w-4 h-4 mr-1" />
                  <span>{item.label}</span>
                </Link>
              ) : index === items.length - 1 ? (
                <span className="breadcrumb-current truncate max-w-xs">
                  {item.label}
                </span>
              ) : (
                <Link to={item.path} className="breadcrumb-item">
                  {item.label}
                </Link>
              )}

              {index < items.length - 1 && (
                <ChevronRight className="breadcrumb-separator w-4 h-4" />
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Breadcrumb;
