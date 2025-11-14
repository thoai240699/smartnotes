// src/utils/categoryHelper.js

const CATEGORY_MAP = [
  { value: 'all', label: 'Tất cả' },
  { value: 'work', label: 'Công việc' },
  { value: 'personal', label: 'Cá nhân' },
  { value: 'shopping', label: 'Mua sắm' },
  { value: 'health', label: 'Sức khỏe' },
  { value: 'other', label: 'Khác' },
];
const MAP_BY_VALUE = CATEGORY_MAP.reduce((acc, curr) => {
    acc[curr.value] = curr.label;
    return acc;
}, {});

export const CATEGORY_VALUES = CATEGORY_MAP.map(c => c.value); 
export const getCategoryLabel = (value) => MAP_BY_VALUE[value] || value?.toUpperCase() || 'KHÁC';
export const CATEGORY_LIST_FOR_FILTER = CATEGORY_MAP; 