"use client"

import React from 'react';
import Pagination from './Pagination';

interface PaginationWrapperProps {
  currentOffset: number;
  total: number;
  limit: number;
}

export default function PaginationWrapper({ currentOffset, total, limit }: PaginationWrapperProps) {
  const handlePageChange = (offset: number) => {
    const params = new URLSearchParams(window.location.search);
    if (offset === 0) {
      params.delete('offset');
    } else {
      params.set('offset', String(offset));
    }
    const newURL = params.toString() ? `?${params.toString()}` : '';
    window.history.pushState({}, '', `/specialists${newURL}`);
    window.location.reload();
  };

  return (
    <Pagination
      currentOffset={currentOffset}
      total={total}
      limit={limit}
      onPageChange={handlePageChange}
    />
  );
}
