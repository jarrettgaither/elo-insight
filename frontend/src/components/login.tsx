import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "./ui/button"; 
import { Input } from "./ui/input"; 
import { Card, CardContent } from "./ui/card";
import { useNavigate } from "react-router-dom";

const Login = ({ setIsLoggedIn }: { setIsLoggedIn: (loggedIn: boolean) => void }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${process.env.REACT_APP_API_URL}/user/profile`, {
          withCredentials: true, 
        });
        setIsLoggedIn(true); // ✅ Update auth state
        navigate("/profile");
      } catch (error) {
        console.log("User not authenticated");
      }
    };

    checkAuth();
  }, [navigate, setIsLoggedIn]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, form, {
        withCredentials: true, 
      });

      setIsLoggedIn(true); // ✅ Update auth state immediately
      navigate("/profile");
    } catch (error: any) {
      console.error("Login failed!", error.response?.data || error.message);
      setMessage("Invalid credentials.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen text-white">
      <div className="w-full max-w-md px-4 py-8">
        {/* Logo or branding element */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-1">Elo Insight</h1>
          <p className="text-accent-400">Track your gaming performance across platforms</p>
        </div>
        
        <Card variant="bordered" className="w-full border-primary-700 bg-surface-dark">
          <CardContent>
            <h2 className="text-2xl font-bold text-white mb-6">Sign in</h2>
            
            {message && (
              <div className="bg-accent-900/40 text-accent-300 p-3 mb-6 border-l-4 border-accent-600">
                {message}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-content-secondary mb-1.5">
                  Email address
                </label>
                <Input 
                  id="email"
                  type="email" 
                  name="email" 
                  placeholder="Enter your email" 
                  value={form.email} 
                  onChange={handleChange} 
                  className="bg-primary-950 border-primary-800 text-white focus:border-accent-600"
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-content-secondary mb-1.5">
                  Password
                </label>
                <Input 
                  id="password"
                  type="password" 
                  name="password" 
                  placeholder="Enter your password" 
                  value={form.password} 
                  onChange={handleChange} 
                  className="bg-primary-950 border-primary-800 text-white focus:border-accent-600"
                  required 
                />
              </div>
              
              <Button 
                className="w-full mt-6 bg-accent-600 hover:bg-accent-700 text-white border-none" 
                size="lg"
              >
                Sign in
              </Button>
              
              <p className="text-center text-primary-400 mt-4">
                Don't have an account?{" "}
                <a href="/register" className="text-accent-500 hover:text-accent-400 transition-colors">
                  Create account
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
