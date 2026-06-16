'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInEmail } from "@/actions/auth";

// IMPORT INDIVIDUAL SHADCN UI (Memperbaiki error Module not found)
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signInEmail(formData);

    setIsLoading(false);
    if (result && "error" in result) {
      setError(result.error);
    }
    // Jika sukses, server action (signInEmail) akan me-redirect, tidak akan sampai ke baris ini.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <p className="text-sm text-muted-foreground">
            Welcome back to SAVORI
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Gunakan elemen <form> HTML biasa untuk onSubmit standard */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email" /* name WAJIB ada untuk FormData */
                type="email"
                placeholder="Enter your email"
                required
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password" /* name WAJIB ada untuk FormData */
                type="password"
                placeholder="Enter your password"
                required
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Button
              type="button" /* type="button" mencegah form tersubmit otomatis */
              variant="outline"
              className="w-full"
              onClick={() => router.push("/register")}
              disabled={isLoading}
            >
              Don't have an account? Sign Up
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}