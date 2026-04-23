interface AppLogoProps
{
  size?: number
  className?: string
}

export function AppLogo({ size, className = '' }: AppLogoProps)
{
  return (
    <img
      src="/icons/icon-192.png"
      alt="OpusVox"
      width={size}
      height={size}
      className={`rounded-xl ${className}`}
    />
  )
}
