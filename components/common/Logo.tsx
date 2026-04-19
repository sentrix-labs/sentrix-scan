import Image from "next/image";

// DECISION: reuse the coin artwork shipped with sentrix-landing so both properties feel like
// one brand. Asset is copied into /public/sentrix-coin-logo.png.
export function SentrixLogo({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/sentrix-coin-logo.png"
      alt="Sentrix"
      width={size}
      height={size}
      className="object-contain"
      quality={100}
      priority
    />
  );
}
