import type { ReactNode } from "react";
import PublicNav from "../../components/PublicNav";

export default function MenuLayout({ children }: { children: ReactNode }) {
  return <><PublicNav/><div className="lg:pl-[230px]">{children}</div></>;
}
