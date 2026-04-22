import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  Settings, 
  PlusCircle, 
  AlertCircle,
  Clock,
  CheckCircle2,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeView, setActiveView] = useState("Landing");
  const [stats, setStats] = useState({ totalReports: 0, totalVolunteers: 0, recentNeeds: [] });
  const [volunteers, setVolunteers] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on load
  const fetchData = async () => {
    try {
      const [statsRes, volRes, needsRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/volunteers"),
        fetch("/api/needs")
      ]);
      setStats(await statsRes.json());
      setVolunteers(await volRes.json());
      setNeeds(await needsRes.json());
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeView]);

  return (
    <div className="flex min-h-screen font-sans">
      {/* --- Sidebar --- */}
      {activeView !== "Landing" && (
        <aside className="w-64 glass-dark border-r border-app-border p-8 flex flex-col fixed h-full z-20">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-app-accent rounded-lg flex items-center justify-center neo-shadow">
               <Activity size={18} className="text-app-bg" />
            </div>
            <div className="text-xl font-bold tracking-tight text-white">
              SMART<span className="text-app-accent">RES</span>
            </div>
          </div>
          
          <nav className="flex-1 space-y-2">
            <NavItem 
              label="Dashboard" 
              icon={<LayoutDashboard size={18} />} 
              active={activeView === "Dashboard"} 
              onClick={() => setActiveView("Dashboard")} 
            />
            <NavItem 
              label="Community Needs" 
              icon={<MapPin size={18} />} 
              active={activeView === "Community Needs"} 
              onClick={() => setActiveView("Community Needs")} 
            />
            <NavItem 
              label="Volunteer Portal" 
              icon={<Users size={18} />} 
              active={activeView === "Volunteer Portal"} 
              onClick={() => setActiveView("Volunteer Portal")} 
            />
            <NavItem 
              label="Settings" 
              icon={<Settings size={18} />} 
              active={activeView === "Settings"} 
              onClick={() => setActiveView("Settings")} 
            />
          </nav>

          <div className="mt-auto p-5 glass rounded-2xl border border-white/5">
            <div className="text-[10px] text-app-text-dim uppercase tracking-[0.2em] font-bold mb-2">
              CORE STATUS
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-app-accent">
              <div className="w-2 h-2 bg-app-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              NEURAL SYNC ACTIVE
            </div>
          </div>
        </aside>
      )}

      {/* --- Main Content --- */}
      <main className={`flex-1 ${activeView !== "Landing" ? "ml-64" : ""} p-10 overflow-y-auto min-h-screen`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={activeView === "Landing" ? "h-full flex flex-col items-center justify-center -mt-8" : ""}
          >
            {activeView === "Landing" && <LandingView onEnter={() => setActiveView("Dashboard")} onReport={() => setActiveView("Community Needs")} />}
            {activeView === "Dashboard" && <DashboardView stats={stats} volunteers={volunteers} needs={needs} />}
            {activeView === "Community Needs" && <NeedsView needs={needs} refresh={fetchData} />}
            {activeView === "Volunteer Portal" && <VolunteerView volunteers={volunteers} refresh={fetchData} />}
            {activeView === "Settings" && <SettingsView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-Components ---

function NavItem({ label, icon, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group ${
        active 
          ? "bg-app-accent/10 text-app-accent shadow-[inset_0_0_12px_rgba(6,182,212,0.1)] border border-app-accent/20" 
          : "text-app-text-dim hover:text-white hover:bg-white/5"
      }`}
    >
      <span className={`${active ? "text-app-accent" : "text-app-text-dim group-hover:text-white"} transition-colors`}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function DashboardView({ stats, volunteers, needs }) {
  const highUrgencyCount = needs.filter(n => n.predictedUrgency === "HIGH").length;

  return (
    <div className="space-y-10">
      <div className="header mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Neural Console</h1>
          <p className="text-app-text-dim font-medium tracking-wide uppercase text-xs">Live Resource Allocation Matrix</p>
        </div>
        <div className="text-right">
           <div className="text-[10px] text-app-text-dim uppercase tracking-[0.2em] font-bold mb-1">System Load</div>
           <div className="text-emerald-500 font-mono text-xs">OPTIMAL // 0.04ms</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Inbound Reports" value={stats.totalReports} />
        <StatCard label="Neural Responders" value={volunteers.length} />
        <StatCard label="Critical Clusters" value={highUrgencyCount} accent />
        <StatCard label="Sync Precision" value={`${stats.totalReports > 0 ? Math.round((needs.filter(n => n.assignedVolunteers.length > 0).length / stats.totalReports) * 100) : 0}%`} />
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 glass-dark rounded-[2.5rem] overflow-hidden border border-white/5">
          <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
            <span className="font-bold text-sm tracking-widest uppercase">Community Event Log</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-app-text-dim uppercase tracking-wider font-bold">Real-time Feed</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[11px] uppercase tracking-widest text-app-text-dim">
                  <th className="px-8 py-4 font-bold">Vector</th>
                  <th className="px-8 py-4 font-bold">Analysis</th>
                  <th className="px-8 py-4 font-bold text-center">Urgency</th>
                  <th className="px-8 py-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {needs.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-12 text-center text-app-text-dim italic">Awaiting neural input...</td></tr>
                ) : (
                  needs.slice(-6).reverse().map((need, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-bold text-white group-hover:text-app-accent transition-colors">{need.location}</div>
                        <div className="text-[10px] text-app-text-dim font-mono tracking-tighter">ID: {need.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="truncate max-w-xs text-app-text-dim group-hover:text-white transition-colors">{need.description}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center">
                          <UrgencyBadge level={need.predictedUrgency} />
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className={`text-[10px] font-black uppercase tracking-widest ${need.assignedVolunteers.length > 0 ? "text-emerald-500" : "text-amber-500"}`}>
                          {need.assignedVolunteers.length > 0 ? `DEPLOYED (${need.assignedVolunteers.length})` : "IDENTIFYING"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-dark rounded-[2.5rem] overflow-hidden border border-white/5 flex flex-col">
          <div className="px-8 py-6 border-b border-white/5 bg-white/5">
            <span className="font-bold text-sm tracking-widest uppercase">Active Responders</span>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            {volunteers.length === 0 ? (
              <div className="px-8 py-12 text-center text-app-text-dim italic text-sm">No units registered</div>
            ) : (
              volunteers.map((vol, i) => (
                <div key={i} className="px-6 py-4 border-b border-white/5 last:border-0 flex justify-between items-center hover:bg-white/5 transition-colors rounded-xl mx-2 my-1">
                  <div>
                    <div className="text-sm font-bold text-white">{vol.name}</div>
                    <div className="text-[10px] text-app-text-dim uppercase tracking-widest font-mono">{vol.skills.slice(0, 2).join(" // ") || "GEN-RES"}</div>
                  </div>
                  <div className={`text-[10px] font-black tracking-widest ${vol.availability === "Available" ? "text-emerald-500" : "text-app-text-dim"}`}>
                    {vol.availability.toUpperCase()}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-8 bg-white/5 border-t border-white/5">
             <div className="flex flex-col items-center gap-4 text-xs text-app-text-dim italic outline-dashed outline-1 outline-white/10 rounded-2xl py-6 bg-black/20">
                <Activity size={18} className="text-app-accent animate-pulse" />
                <span className="font-mono tracking-tighter text-[10px] uppercase font-bold not-italic">Cluster Mapping Enabled</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NeedsView({ needs, refresh }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    description: "",
    ngoUrgency: "MEDIUM"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      setFormData({ name: "", phone: "", location: "", description: "", ngoUrgency: "MEDIUM" });
      refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="header mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Community Intake</h1>
        <p className="text-app-text-dim font-medium tracking-wide uppercase text-xs">Vectorized Problem Injection</p>
      </div>

      <div className="grid grid-cols-2 gap-10">
        <div className="glass-dark border border-white/5 rounded-[3rem] p-10 shadow-2xl h-fit relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-app-accent/5 rounded-full blur-3xl" />
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <h2 className="text-xl font-bold flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-app-accent/10 rounded-lg flex items-center justify-center text-app-accent">
                <PlusCircle size={20} />
              </div>
              Initialize Report
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              <Input label="Reporter Handle" value={formData.name} onChange={v => setFormData({...formData, name: v})} required />
              <Input label="Phone Number" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} required />
            </div>
            
            <Input label="Spatial Vector (Location)" value={formData.location} onChange={v => setFormData({...formData, location: v})} required />
            
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] font-black text-app-text-dim mb-2.5 ml-1">Urgency Priority</label>
              <select 
                className="w-full glass border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-app-accent transition-all cursor-pointer text-white appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: 'right 1.25rem center', backgroundRepeat: 'no-repeat' }}
                value={formData.ngoUrgency}
                onChange={e => setFormData({...formData, ngoUrgency: e.target.value})}
              >
                <option value="LOW" className="bg-app-bg text-white">LOW</option>
                <option value="MEDIUM" className="bg-app-bg text-white">MEDIUM</option>
                <option value="HIGH" className="bg-app-bg text-white">HIGH</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] font-black text-app-text-dim mb-2.5 ml-1">Event Logs (Description)</label>
              <textarea 
                className="w-full glass border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-app-accent transition-all min-h-[160px] resize-none text-white placeholder:text-app-text-dim/40"
                placeholder="Initialize description telemetry..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-app-accent text-app-bg font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 neo-shadow text-sm uppercase tracking-widest"
            >
              {loading ? "Injecting Data..." : "Broadcast Report"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-3 mb-4 ml-2">
            <Clock size={20} className="text-app-text-dim" />
            Neural Feed
          </h2>
          <div className="max-h-[800px] overflow-y-auto space-y-4 pr-2">
            {needs.slice().reverse().map((need, i) => (
               <motion.div 
                key={i} 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-dark border border-white/5 rounded-3xl p-6 shadow-xl space-y-4 group hover:border-app-accent/30 transition-all"
               >
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <MapPin size={12} className="text-app-accent" />
                           <span className="font-bold text-base tracking-tight text-white">{need.location}</span>
                        </div>
                        <div className="text-[10px] text-app-text-dim font-mono uppercase tracking-[0.1em]">Timestamp: {new Date(need.createdAt?.seconds * 1000).toLocaleTimeString()}</div>
                     </div>
                     <UrgencyBadge level={need.predictedUrgency} />
                  </div>
                  <p className="text-sm text-app-text-dim line-clamp-3 leading-relaxed group-hover:text-white/90 transition-colors italic">{need.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[11px] font-bold">
                     <div className="flex items-center gap-2 text-emerald-500 uppercase tracking-widest">
                       <Users size={12} />
                       {need.assignedVolunteers.length} Ready Units
                     </div>
                     <span className="text-app-text-dim/60 font-mono tracking-tighter">
                       LAT: {Math.random().toFixed(4)}° / LNG: {Math.random().toFixed(4)}°
                     </span>
                  </div>
               </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VolunteerView({ volunteers, refresh }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    skills: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills.split(",").map(s => s.trim()).filter(s => s)
        })
      });
      setFormData({ name: "", phone: "", email: "", location: "", skills: "" });
      refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="header mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Responder Hub</h1>
        <p className="text-app-text-dim font-medium tracking-wide uppercase text-xs">Unit Mobilization Portal</p>
      </div>

      <div className="grid grid-cols-2 gap-10">
        <div className="glass-dark border border-white/5 rounded-[3rem] p-10 shadow-2xl h-fit relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <h2 className="text-xl font-bold flex items-center gap-3 mb-8 text-white">
              <div className="w-8 h-8 bg-app-accent/10 rounded-lg flex items-center justify-center text-app-accent">
                <CheckCircle2 size={20} />
              </div>
              Initialize Unit
            </h2>
            
            <Input label="Unit Name (Full Name)" value={formData.name} onChange={v => setFormData({...formData, name: v})} required />
            
            <div className="grid grid-cols-2 gap-6">
              <Input label="Comms Channel (Phone)" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} required />
              <Input label="Neural ID (Email)" value={formData.email} onChange={v => setFormData({...formData, email: v})} required />
            </div>
            
            <Input label="Deployment Vector (Location)" value={formData.location} onChange={v => setFormData({...formData, location: v})} required />
            
            <Input label="Specializations (Comma separated)" value={formData.skills} onChange={v => setFormData({...formData, skills: v})} placeholder="Medical, Heavy Lift..." />

            <button 
              disabled={loading}
              className="w-full bg-app-accent text-app-bg font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 neo-shadow text-sm uppercase tracking-widest"
            >
              {loading ? "Syncing..." : "Activate Responder"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-3 mb-4 ml-2">
            <Users size={20} className="text-app-text-dim" />
            Active Units
          </h2>
          <div className="grid grid-cols-1 gap-4 max-h-[800px] overflow-y-auto pr-2">
            {volunteers.map((vol, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="glass border border-white/5 rounded-[2rem] p-8 shadow-xl flex justify-between items-center group hover:border-app-accent/30 transition-all"
              >
                <div className="space-y-2">
                  <h3 className="font-bold text-lg leading-tight text-white group-hover:text-app-accent transition-colors">{vol.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-app-text-dim font-medium uppercase tracking-tight">
                    <MapPin size={10} className="text-app-accent" />
                    Sector: {vol.location}
                  </div>
                  <div className="flex gap-2 mt-4">
                    {vol.skills.slice(0, 3).map((skill, si) => (
                      <span key={si} className="text-[10px] glass-dark px-3 py-1 rounded-full font-bold uppercase tracking-wider text-app-text-dim border border-white/5">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${vol.availability === "Available" ? "text-emerald-500" : "text-app-text-dim"}`}>
                    STATUS: {vol.availability}
                  </div>
                  <div className="text-[10px] text-app-text-dim/60 font-mono tracking-tighter uppercase px-3 py-1.5 border border-white/5 rounded-xl bg-white/5">
                    Unit ID: {Math.floor(Math.random() * 9000 + 1000)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingView({ onEnter, onReport }) {
  return (
    <div className="max-w-5xl w-full relative">
      {/* Decorative Glows */}
      <div className="absolute -top-40 -left-20 w-80 h-80 bg-app-accent/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-20 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="text-center space-y-8 mb-20 relative z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-app-accent text-[11px] uppercase tracking-[0.4em] font-black rounded-full mb-4 shadow-xl backdrop-blur-sm"
        >
          <div className="w-1.5 h-1.5 bg-app-accent rounded-full animate-pulse" />
          Neural Protocol 5.0
        </motion.div>
        
        <h1 className="text-8xl font-extrabold tracking-tight leading-[0.85] text-white">
          SMART<span className="text-app-accent">RES</span><br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/20">SYSTEMS</span>
        </h1>
        
        <p className="text-xl text-app-text-dim max-w-2xl mx-auto font-light leading-relaxed">
          The next generation of community resilience. Automated risk prediction 
          meets dynamic responder coordination at scale.
        </p>

        <div className="flex items-center justify-center gap-6 pt-4">
           <button 
            onClick={onEnter}
            className="px-10 py-4 bg-app-accent text-app-bg font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all neo-shadow"
           >
             Enter Dashboard
           </button>
           <button 
            onClick={onReport}
            className="px-10 py-4 glass text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
           >
             Report Now
           </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 relative z-10">
        <LandingCard 
          icon={<LayoutDashboard size={24} />}
          title="Command Console"
          desc="Unified view of community health and emergency clusters."
          onClick={onEnter}
        />
        <LandingCard 
          icon={<MapPin size={24} />}
          title="Rapid Intake"
          desc="Direct neural injection of community needs and events."
          onClick={onReport}
        />
        <LandingCard 
          icon={<Users size={24} />}
          title="Responder Hub"
          desc="Synchronize with established volunteer response teams."
          onClick={() => {}} 
        />
      </div>

      <div className="mt-24 pt-10 border-t border-white/5 flex justify-between items-center text-app-text-dim/40 italic">
        <div className="flex items-center gap-8 text-[11px] font-mono tracking-widest uppercase">
          <div className="flex items-center gap-2 font-bold">
            <div className="w-1 h-1 bg-emerald-500 rounded-full" />
            VOD: ACTIVE
          </div>
          <div>LOC: MULTI-REGION</div>
          <div>Uptime: 99.99%</div>
        </div>
        <div className="text-[11px] font-bold tracking-widest">© 2026 SMARTRES PROTOCOL</div>
      </div>
    </div>
  );
}

function LandingCard({ icon, title, desc, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="group text-left p-10 rounded-[3rem] glass hover:bg-white/10 hover:border-app-accent/30 transition-all duration-500 active:scale-95 cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-app-accent/5 rounded-full blur-2xl group-hover:bg-app-accent/10 transition-colors" />
      
      <div className="mb-10 w-12 h-12 bg-app-accent/10 rounded-2xl flex items-center justify-center text-app-accent group-hover:scale-110 transition-transform duration-500 border border-app-accent/20">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 tracking-tight text-white">{title}</h3>
      <p className="text-base leading-relaxed text-app-text-dim group-hover:text-white/80 transition-colors">
        {desc}
      </p>
      <div className="mt-10 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-app-accent opacity-60 group-hover:opacity-100 transition-opacity">
        Initialize
        <div className="w-8 h-[1px] bg-app-accent/30 group-hover:w-12 transition-all" />
      </div>
    </button>
  );
}

function SettingsView() {
  return (
    <div className="space-y-10">
      <div className="header mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Protocol Settings</h1>
        <p className="text-app-text-dim font-medium tracking-wide uppercase text-xs">Kernel Parameter Calibration</p>
      </div>

      <div className="grid grid-cols-1 gap-8 max-w-2xl">
        <div className="glass-dark border border-white/5 rounded-[3rem] p-10 shadow-2xl space-y-8">
          <div>
            <h3 className="text-xs font-black mb-6 flex items-center gap-2 text-app-accent uppercase tracking-[0.2em]">
              <Activity size={14} />
              Neural Logic Weights
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 glass rounded-2xl border border-white/5">
                <div>
                  <div className="text-sm font-bold text-white">Inference Threshold</div>
                  <div className="text-[10px] text-app-text-dim font-medium uppercase mt-1">Sensitivity Matrix: High-Precision</div>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
                  OPTIMIZED
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black mb-6 flex items-center gap-2 text-app-accent uppercase tracking-[0.2em]">
              <Users size={14} />
              Network Topology
            </h3>
            <div className="p-6 glass rounded-2xl border border-white/5 space-y-4 font-mono">
              <div className="flex items-center justify-between py-1">
                <span className="text-[11px] font-bold text-app-text-dim uppercase">Autonomous Match</span>
                <span className="text-[11px] font-black text-emerald-500 tracking-widest">ENABLED</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[11px] font-bold text-app-text-dim uppercase">Vector Radius</span>
                <span className="text-[11px] font-black text-white tracking-widest">5,000m // CLUSTER-L2</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[11px] font-bold text-app-text-dim uppercase">Latency Shield</span>
                <span className="text-[11px] font-black text-white tracking-widest">ACTIVE (12ms)</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <button className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-2xl opacity-40 cursor-not-allowed border border-white/10 transition-all">
              Save Neural Config
            </button>
            <p className="mt-4 text-[10px] text-app-text-dim/60 italic font-medium">Access to kernel modifications is restricted to Level 4 Administrators.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Utils ---

function StatCard({ label, value, accent }) {
  return (
    <div className="glass-dark border border-white/5 p-8 rounded-[2rem] shadow-xl group hover:border-app-accent/30 transition-all relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-app-accent/5 rounded-full blur-2xl group-hover:bg-app-accent/10 transition-colors shadow-inner" />
      <div className="relative z-10">
        <div className={`text-4xl font-extrabold tracking-tight mb-4 ${accent ? 'text-app-accent' : 'text-white'}`}>
          {value}
        </div>
        <div className="text-[10px] text-app-text-dim uppercase tracking-[0.2em] font-black">
          {label}
        </div>
      </div>
    </div>
  );
}

function UrgencyBadge({ level }) {
  const styles = {
    HIGH: "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.1)]",
    MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.1)]",
    LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-[0.1em] ${styles[level]}`}>
      {level}
    </span>
  );
}

function Input({ label, value, onChange, placeholder, required = false }) {
  return (
    <div className="relative group">
      <label className="block text-[11px] uppercase tracking-[0.2em] font-black text-app-text-dim mb-2.5 ml-1 transition-colors group-focus-within:text-app-accent">{label}</label>
      <input 
        type="text"
        required={required}
        placeholder={placeholder}
        className="w-full glass border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-app-accent transition-all text-white placeholder:text-app-text-dim/30 hover:border-white/20"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
