import React from 'react';

const TableSkeleton = ({ columns = 5, rows = 10, padding = 'py-4' }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <td key={colIndex} className={`px-6 ${padding}`}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};

export default TableSkeleton;
