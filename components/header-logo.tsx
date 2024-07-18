import Link from "next/link";
import Image from "next/image";

export default function HeaderLogo() {
  return (
    <Link href="/">
      <div className="hidden lg:flex items-center">
        <Image src="logo.svg" width={28} height={28} alt="logo" />
        <p className="font-semibold text-white text-2xl ml-2.5">Finance</p>
      </div>
    </Link>
  );
}