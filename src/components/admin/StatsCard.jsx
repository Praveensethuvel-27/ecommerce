function StatsCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#8B7355]">{title}</p>
          <p className="text-2xl font-bold text-[#2D5A27] mt-1">{value}</p>
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-[#E8F0E8] flex items-center justify-center text-[#2D5A27]">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsCard;
