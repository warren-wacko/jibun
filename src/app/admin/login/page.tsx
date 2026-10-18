import type { Metadata } from "next";
import Link from "next/link";
import { AdminFrame } from "../_components/AdminFrame";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <AdminFrame>
      <main className="adm-login">
        <span className="adm-wordmark" aria-hidden="true">
          jibun<span className="dot">.</span>
        </span>
        <div className="adm-login-card">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to manage cards, pages and renewals.</p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
        <Link href="/" className="adm-login-back">
          ← Back to the website
        </Link>
      </main>
    </AdminFrame>
  );
}
