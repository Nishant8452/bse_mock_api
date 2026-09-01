import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Calculate sliding window for page pills (up to 5 buttons)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  const pageNumbers = [];
  for (let p = startPage; p <= endPage; p++) {
    pageNumbers.push(p);
  }

  return (
    <div className="pagination-bar">
      <div className="pagination-left">
        <label htmlFor="page-size-select">Rows per page:</label>
        <select
          id="page-size-select"
          className="form-select select-xs"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="200">200</option>
          <option value="500">500</option>
          <option value="2000">All (2000)</option>
        </select>
      </div>

      <div className="pagination-center" id="pagination-info">
        Page {currentPage} of {totalPages} ({totalItems.toLocaleString()} total)
      </div>

      <div className="pagination-right">
        <button
          id="btn-prev-page"
          className="btn btn-icon btn-sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        <div id="page-numbers-container" className="page-numbers">
          {pageNumbers.map((p) => (
            <button
              key={p}
              className={`btn-page ${p === currentPage ? "active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          id="btn-next-page"
          className="btn btn-icon btn-sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
