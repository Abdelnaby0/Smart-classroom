import { useState } from "react";
import {
  Lightbulb,
  School,
  Cpu,
  Power,
  Settings,
  Monitor,
  Wifi,
  BellRing ,
} from "lucide-react";

export default function App() {
  const [rooms, setRooms] = useState([
    { id: 1, name: "Room A1", lecture: "AI", light: true, mode: "auto" },
    { id: 2, name: "Room A2", lecture: "Database", light: false, mode: "auto" },
    { id: 3, name: "Room B1", lecture: "Networks", light: true, mode: "auto" },
    { id: 4, name: "Room B2", lecture: "ML", light: false, mode: "auto" },
  ]);

  const updateRoom = (id, mode) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === id
          ? {
              ...room,
              mode,
              light:
                mode === "manual_on"
                  ? true
                  : mode === "manual_off"
                  ? false
                  : room.light,
            }
          : room
      )
    );
  };

  const activeRooms = rooms.filter((room) => room.light).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 sm:-70 md:w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full"></div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between gap-6 mb-10">
          <div>
            <h1 className="sm:text-4xl md:text-5xl  font-bold flex items-center gap-3">
              <Monitor size={42} className="text-cyan-400" />
              Smart Classroom
            </h1>
            <p className="text-slate-400 mt-3 text-lg">
              IoT Real-Time Classroom Light Control Dashboard
            </p>
          </div>

          {/* Stats */}
          <div className="grid  sm:grid-cols-2 xl:grid-cols-2  gap-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 min-w-[180px]">
              <p className="text-slate-400 text-sm">Total Rooms</p>
              <h2 className="text-3xl font-bold mt-2">{rooms.length}</h2>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 min-w-[180px]">
              <p className="text-slate-400 text-sm">Rooms ON</p>
              <h2 className="text-3xl font-bold mt-2 text-green-400">
                {activeRooms}
              </h2>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wifi className="text-green-400" />
            <span className="text-lg">System Connected</span>
          </div>

          <div className="flex items-center gap-2 text-cyan-400">
            <BellRing  size={18} />
            <span>Live Monitoring</span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="group bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:border-cyan-400/40 hover:scale-105 transition duration-300 shadow-2xl"
            >
              {/* Top */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{room.name}</h2>
                  <p className="text-slate-400 text-sm">Classroom</p>
                </div>

                <div
                  className={`p-4 rounded-2xl transition ${
                    room.light
                      ? "bg-yellow-400/20 text-yellow-300"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  <Lightbulb size={28} />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-slate-300">
                  <School size={18} />
                  <span>{room.lecture}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Power
                    size={18}
                    className={
                      room.light ? "text-green-400" : "text-red-400"
                    }
                  />
                  <span
                    className={`font-semibold ${
                      room.light ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {room.light ? "LIGHT ON" : "LIGHT OFF"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-cyan-400">
                  <Cpu size={18} />
                  <span className="uppercase">{room.mode}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateRoom(room.id, "manual_on")}
                  className="bg-green-500 hover:bg-green-600 py-2 rounded-xl text-sm font-semibold"
                >
                  ON
                </button>

                <button
                  onClick={() => updateRoom(room.id, "manual_off")}
                  className="bg-red-500 hover:bg-red-600 py-2 rounded-xl text-sm font-semibold"
                >
                  OFF
                </button>

                <button
                  onClick={() => updateRoom(room.id, "auto")}
                  className="bg-cyan-500 hover:bg-cyan-600 py-2 rounded-xl text-sm font-semibold flex justify-center items-center gap-1"
                >
                  <Settings size={15} />
                  AUTO
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}