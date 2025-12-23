import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Moon, Sun } from "lucide-react";
import { API_ENDPOINTS, apiCall } from "../config/api";

interface AuthFormProps {
  onAuthSuccess: (token: string, userId: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function AuthForm({
  onAuthSuccess,
  darkMode,
  toggleDarkMode,
}: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const data = await apiCall(API_ENDPOINTS.login, {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        if (data.token && data.userId) {
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("userId", data.userId);
          onAuthSuccess(data.token, data.userId);
        }
      } else {
        // Sign up
        const data = await apiCall(API_ENDPOINTS.signup, {
          method: "POST",
          body: JSON.stringify({ email, password, name }),
        });

        if (data.token && data.userId) {
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("userId", data.userId);
          onAuthSuccess(data.token, data.userId);
        } else {
          // If no token returned, switch to login
          setError("Account created! Please login.");
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <Button onClick={toggleDarkMode} variant="outline" size="sm">
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            <span className="sr-only">Toggle dark mode</span>
          </Button>
        </div>
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center">Done Dailies</CardTitle>
            <CardDescription className="text-center">
              {isLogin ? "Sign in to your account" : "Create a new account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    placeholder="John Doe"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
