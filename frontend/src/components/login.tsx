import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "./ui/button"; 
import { Input } from "./ui/input"; 
import { Card, CardContent } from "./ui/card";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (localStorage.getItem("token")) {
      window.location.href = "/profile";
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = `${process.env.REACT_APP_API_URL}/auth/login`;
  
    console.log("Sending login request to:", apiUrl);
    console.log("Payload:", form);
  
    try {
      const response = await axios.post(apiUrl, form);
      console.log("Login successful! Response:", response.data);
  
      localStorage.setItem("token", response.data.token);
      window.location.href = "/profile";
    } catch (error: any) {
      console.error("Login failed! Error:", error.response?.data || error.message);
      setMessage("Invalid credentials.");
    }
  };
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <Card className="w-full max-w-md bg-gray-800 text-white p-6 shadow-lg">
        <CardContent>
          <h2 className="text-2xl font-bold text-center mb-4">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <Input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <Button className="w-full">Login</Button>
          </form>
          <p className="text-red-400 text-center mt-2">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
