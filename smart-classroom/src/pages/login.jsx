import { useState } from "react";
import { Monitor, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";


export default function Login({ onLogin }) {

    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = () => {
        if (
            email === "mahmoud.abdelnaby@user.com" &&
            password === "12345678"
        ) {
            localStorage.setItem("auth", "true");
            onLogin(true);
            navigate("/"); // 👈 redirect to home
        } else {
            setError("Invalid email or password");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden px-4">

            {/* Animated Background */}
            <div className="absolute w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-cyan-500/20 blur-[120px] sm:blur-[150px] rounded-full animate-pulse"></div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-sm sm:max-w-md p-[1px] rounded-3xl bg-gradient-to-r from-cyan-500/40 to-blue-500/40">

                <div className="bg-slate-950 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">

                    {/* Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <Monitor className="mx-auto text-cyan-400 mb-2" size={28} />
                        <h1 className="text-xl sm:text-2xl font-bold text-white">
                            Smart Classroom
                        </h1>
                        <p className="text-slate-400 text-xs sm:text-sm">
                            Secure system access
                        </p>
                    </div>

                    {/* Email */}
                    <div className="mb-4 sm:mb-5">
                        <label className="text-xs sm:text-sm text-slate-400 mb-1 block">Email</label>
                        <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl px-3 py-2 sm:py-3 focus-within:border-cyan-400 focus-within:shadow-lg focus-within:shadow-cyan-500/20 transition">
                            <Mail size={16} className="text-slate-400 mr-2" />
                            <input
                                type="email"
                                placeholder="Enter email"
                                className="bg-transparent outline-none w-full text-white placeholder:text-slate-500 text-sm"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="mb-4 sm:mb-5">
                        <label className="text-xs sm:text-sm text-slate-400 mb-1 block">Password</label>
                        <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl px-3 py-2 sm:py-3 focus-within:border-cyan-400 focus-within:shadow-lg focus-within:shadow-cyan-500/20 transition">
                            <Lock size={16} className="text-slate-400 mr-2" />
                            <input
                                type="password"
                                placeholder="Enter password"
                                className="bg-transparent outline-none w-full text-white placeholder:text-slate-500 text-sm"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-red-400 text-xs sm:text-sm mb-3 text-center animate-pulse">
                            {error}
                        </p>
                    )}

                    {/* Button */}
                    <button
                        onClick={handleLogin}
                        className="cursor-pointer w-full bg-cyan-600 hover:bg-cyan-700 active:scale-95 transition-all duration-200 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base shadow-lg shadow-cyan-500/20"
                    >
                        Login
                    </button>

                </div>
            </div>
        </div>
    );
}