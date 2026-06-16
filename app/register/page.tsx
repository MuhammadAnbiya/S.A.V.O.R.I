'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUpEmail } from "@/actions/auth";

// IMPORT INDIVIDUAL SHADCN UI (Mencegah error Module not found)
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // FormData mengambil nilai berdasarkan atribut "name" di elemen <Input>
    const formData = new FormData(e.currentTarget);
    const result = await signUpEmail(formData);

    setIsLoading(false);
    if (result && "error" in result) {
      setError(result.error);
    } else if (result && "success" in result) {
      // Email confirmation required - show success message
      setSuccessMessage(result.message);
    }
    // Jika redirect, server action akan me-redirect, tidak akan sampai ke baris ini.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign up to get started with SAVORI
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-6">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          
          {/* Mengganti <Form> dengan tag <form> standar HTML */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name" /* name WAJIB ada */
                type="text"
                placeholder="Enter your name"
                required
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email" /* name WAJIB ada */
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
                name="password" /* name WAJIB ada */
                type="password"
                placeholder="Enter your password"
                required
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
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
              type="button" /* Mencegah tombol ini melakukan submit form otomatis */
              variant="outline"
              className="w-full"
              onClick={() => router.push("/login")}
              disabled={isLoading}
            >
              Already have an account? Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}