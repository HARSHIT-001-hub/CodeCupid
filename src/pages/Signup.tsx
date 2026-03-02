import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { ArrowRight, Check, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";
import { SKILLS, INTERESTS, DEPARTMENTS } from "@/data/constants";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [semester, setSemester] = useState(1);
  const [department, setDepartment] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const toggleItem = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await signup(email, password, {
        name,
        semester,
        department,
        skills: selectedSkills,
        interests: selectedInterests,
        bio,
        githubLink,
        photoURL: "",
      });
      navigate("/discover");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? "bg-primary w-8" : "bg-border w-4"}`} />
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="font-display text-xl font-semibold mb-2">Create your account</h2>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">College Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@campus.edu"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Semester</label>
                  <select value={semester} onChange={e => setSemester(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Department</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Select...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => setStep(2)} disabled={!name || !email || !password || password.length < 6}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 btn-primary-glow hover:brightness-110 transition-all disabled:opacity-50">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-semibold mb-1">Your Skills</h2>
                <p className="text-sm text-muted-foreground mb-4">Select technologies you work with</p>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map(skill => (
                    <button key={skill} onClick={() => toggleItem(skill, selectedSkills, setSelectedSkills)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedSkills.includes(skill)
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-secondary text-muted-foreground border border-border hover:border-primary/30"
                      }`}>
                      {selectedSkills.includes(skill) && <Check className="w-3 h-3 inline mr-1" />}{skill}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold mb-1">Your Interests</h2>
                <p className="text-sm text-muted-foreground mb-4">What excites you?</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <button key={interest} onClick={() => toggleItem(interest, selectedInterests, setSelectedInterests)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedInterests.includes(interest)
                          ? "bg-accent/20 text-accent border border-accent/30"
                          : "bg-secondary text-muted-foreground border border-border hover:border-accent/30"
                      }`}>
                      {selectedInterests.includes(interest) && <Check className="w-3 h-3 inline mr-1" />}{interest}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium">Back</button>
                <button onClick={() => setStep(3)} disabled={selectedSkills.length === 0}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold btn-primary-glow hover:brightness-110 transition-all disabled:opacity-50">
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="font-display text-xl font-semibold mb-2">Almost there!</h2>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell others about yourself..." rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">GitHub Profile</label>
                <input value={githubLink} onChange={e => setGithubLink(e.target.value)} placeholder="https://github.com/username"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium">Back</button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold btn-primary-glow hover:brightness-110 transition-all disabled:opacity-50">
                  {loading ? "Creating..." : "Launch Profile 🚀"}
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
