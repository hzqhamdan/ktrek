import { AuthComponent } from "@/components/ui/sign-up";
import { Gem } from "lucide-react";

// Custom logo component using the existing logo
const CustomLogo = () => (
  <div className="bg-primary text-white rounded-md p-1.5">
    <Gem className="h-4 w-4" />
  </div>
);

export default function SignUpDemoPage() {
  return (
    <AuthComponent 
      logo={<CustomLogo />} 
      brandName="K-Trek" 
    />
  );
}
