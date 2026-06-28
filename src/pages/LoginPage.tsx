import { AuthComponent } from "../components/ui/sign-up";
import { Text_03 } from "../components/ui/wave-text";

// Image logo with neon purple/pink glow styling to match the provided image
const CustomLogo = () => (
  <div className="relative">
    <div className="absolute inset-0 bg-fuchsia-500 blur-[20px] opacity-40 rounded-3xl" />
    <img 
      src="/logo.png" 
      alt="DeadlineVibe Logo" 
      className="w-16 h-16 rounded-2xl relative z-10 border border-white/10 shadow-2xl object-cover"
      onError={(e) => {
        // Fallback if the user hasn't put the image in public/logo.png yet
        (e.target as HTMLImageElement).style.display = 'none';
        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
      }}
    />
    <div className="hidden w-16 h-16 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl relative z-10 flex items-center justify-center border border-white/20 shadow-2xl">
      <span className="text-2xl font-bold text-white">DV</span>
    </div>
  </div>
);

// Animated brand text
const AnimatedBrandName = () => (
  <div className="text-2xl font-bold tracking-tight text-white mt-2">
    <Text_03 text="DeadlineVibe" />
  </div>
);

export default function LoginPage() {
  return (
    <AuthComponent 
      logo={<CustomLogo />} 
      brandName={<AnimatedBrandName /> as any} 
    />
  );
}
