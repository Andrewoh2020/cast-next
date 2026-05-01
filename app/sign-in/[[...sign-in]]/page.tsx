import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
      <SignIn fallbackRedirectUrl="/studio" />
    </div>
  );
}
