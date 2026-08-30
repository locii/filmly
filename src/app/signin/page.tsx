import type { Metadata } from "next";
import SignInForm from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return <SignInForm />;
}
