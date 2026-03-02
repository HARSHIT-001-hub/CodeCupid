import { useState } from "react";
import { useAuth, UserProfile } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Save } from "lucide-react";
import { SKILLS, INTERESTS, DEPARTMENTS } from "@/data/constants";
import { toast } from "sonner";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  const { profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [interests, setInterests] = useState<string[]>(profile?.interests || []);
  const [department, setDepartment] = useState(profile?.department || "");
  const [semester, setSemester] = useState(profile?.semester || 1);
  const [githubLink, setGithubLink] = useState(profile?.githubLink || "");
  const [saving, setSaving] = useState(false);

  const toggleItem = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (name.trim().length > 100) {
      toast.error("Name must be under 100 characters");
      return;
    }
    if (bio.length > 500) {
      toast.error("Bio must be under 500 characters");
      return;
    }
    if (skills.length === 0) {
      toast.error("Select at least one skill");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        skills,
        interests,
        department,
        semester,
        githubLink: githubLink.trim(),
      });
      toast.success("Profile updated!");
      onClose();
    } catch (err: any) {
      toast.error("Update failed: " + err.message);
    }
    setSaving(false);
  };

  if (!profile) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative glass-card rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold">Edit Profile</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  maxLength={100} />
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  maxLength={500} />
                <p className="text-xs text-muted-foreground mt-1">{bio.length}/500</p>
              </div>

              {/* Department & Semester */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Select...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Semester</label>
                  <select value={semester} onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Skills</label>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.map(skill => (
                    <button key={skill} onClick={() => toggleItem(skill, skills, setSkills)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        skills.includes(skill)
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-secondary text-muted-foreground border border-border hover:border-primary/30"
                      }`}>
                      {skills.includes(skill) && <Check className="w-3 h-3 inline mr-1" />}{skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Interests</label>
                <div className="flex flex-wrap gap-1.5">
                  {INTERESTS.map(interest => (
                    <button key={interest} onClick={() => toggleItem(interest, interests, setInterests)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        interests.includes(interest)
                          ? "bg-accent/20 text-accent border border-accent/30"
                          : "bg-secondary text-muted-foreground border border-border hover:border-accent/30"
                      }`}>
                      {interests.includes(interest) && <Check className="w-3 h-3 inline mr-1" />}{interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* GitHub */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">GitHub Profile</label>
                <input value={githubLink} onChange={(e) => setGithubLink(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              {/* Save */}
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 btn-primary-glow hover:brightness-110 transition-all disabled:opacity-50">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;
