interface ProbabilitySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ProbabilitySlider({
  value,
  onChange,
  disabled = false,
}: ProbabilitySliderProps) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        className="flex-1 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-5
                   [&::-webkit-slider-thumb]:h-5
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-amber-600
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:shadow-md
                   [&::-moz-range-thumb]:w-5
                   [&::-moz-range-thumb]:h-5
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-amber-600
                   [&::-moz-range-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:border-0"
      />
      <div className="w-16 text-right">
        <span className="font-bold text-amber-900 text-lg">{value}%</span>
      </div>
    </div>
  );
}
