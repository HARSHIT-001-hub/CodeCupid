import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Github, GraduationCap, Building2, Edit3, Database } from "lucide-react";
import { seedDummyData } from "@/services/firestore";
import { toast } from "sonner";
import { useState } from "react";

const Profile = () => {
  const { profile } = useAuth();
  const [seeding, setSeeding] = useState(false);

  if (!profile) return null;

  const initials = profile.name?.split(" ").map(n => n[0]).join("") || "?";

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDummyData();
      toast.success("Dummy data seeded to Firestore!");
    } catch (err: any) {
      toast.error("Seed failed: " + err.message);
    }
    setSeeding(false);
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          {/* Avatar */}
          <div className="relative inline-block mb-5">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt={profile.name} className="w-28 h-28 rounded-full object-cover border-2 border-primary/30" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center">
                <span className="font-display text-3xl font-bold text-primary">{initials}</span>
              </div>
            )}
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <h2 className="font-display text-2xl font-bold">{profile.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
          <div className="flex items-center justify-center gap-3 mt-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Sem {profile.semester}</span>
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {profile.department}</span>
          </div>

          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{profile.bio}</p>

          {/* Skills */}
          <div className="mt-6">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Skills</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {profile.skills?.map(s => <span key={s} className="skill-tag">{s}</span>)}
            </div>
          </div>

          {/* Interests */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Interests</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {profile.interests?.map(i => <span key={i} className="interest-tag">{i}</span>)}
            </div>
          </div>

          {/* GitHub */}
          {profile.githubLink && (
            <a href={profile.githubLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
              <Github className="w-4 h-4" /> GitHub Profile
            </a>
          )}
        </motion.div>

        {/* Seed Data Button (for setup)
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="mt-6 w-full py-3 rounded-xl bg-secondary text-muted-foreground hover:text-foreground text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {seeding ? "Seeding..." : "Seed Dummy Data to Firestore"}
          </button>
        </motion.div> */}
      </div>
    </Layout>
  );
};

export default Profile;
