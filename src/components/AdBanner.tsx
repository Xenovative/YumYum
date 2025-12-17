interface AdBannerProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function AdBanner({ size = 'medium', className = '' }: AdBannerProps) {
  const heights = {
    small: 'h-16',
    medium: 'h-24',
    large: 'h-32'
  }

  return (
    <div 
      className={`w-full ${heights[size]} bg-dark-800 border border-dashed border-gray-700 rounded-xl flex items-center justify-center ${className}`}
    >
      <div className="text-center">
        <p className="text-gray-500 text-xs">廣告位</p>
        <p className="text-gray-600 text-[10px]">AD SPACE</p>
      </div>
    </div>
  )
}
