import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "./ui/button"; 
import { Input } from "./ui/input"; 
import { Card, CardContent } from "./ui/card"; 

const Register = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
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
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, form);
      setMessage("User registered successfully! Please log in.");
    } catch (error) {
      setMessage("Error registering user.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <Card className="w-full max-w-md bg-gray-800 text-white p-6 shadow-lg">
        <CardContent>
          <h2 className="text-2xl font-bold text-center mb-4">Register</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
            <Input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <Input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <Button className="w-full">Register</Button>
          </form>
          <p className="text-red-400 text-center mt-2">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
