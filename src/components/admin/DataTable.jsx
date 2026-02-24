function DataTable({ columns, data, renderRow, selectable, selectedIds, onSelectAll }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#8B7355]/20">
      <table className="w-full">
        <thead>
          <tr className="bg-[#E8F0E8]/50 border-b border-[#8B7355]/20">
            {selectable && (
              <th className="p-4 w-12">
                <input
                  type="checkbox"
                  checked={selectedIds?.length === data.length && data.length > 0}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                />
              </th>
            )}
            {columns.map((col) => (
              <th key={col.key} className="text-left p-4 font-medium text-[#6B4423]">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => renderRow(row, i))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
