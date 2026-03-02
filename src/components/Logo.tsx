import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  linkTo?: string;
}

const sizeMap = {
  sm: { icon: "text-sm", text: "text-lg" },
  md: { icon: "text-base", text: "text-xl" },
  lg: { icon: "text-lg", text: "text-2xl" },
};

const Logo = ({ size = "md", linkTo }: LogoProps) => {
  const s = sizeMap[size];

  const content = (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
        <span className={`text-primary font-bold font-mono ${s.icon}`}>&lt;/&gt;</span>
      </div>
      <span className={`font-display font-bold gradient-text ${s.text}`}>CodeCupid</span>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
};

export default Logo;
