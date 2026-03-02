import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Project, getApplications, Application } from "@/services/firestore";
import { UserProfile } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { ArrowLeft, Users, User, ExternalLink } from "lucide-react";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "projects", projectId));
      if (!snap.exists()) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const proj = { id: snap.id, ...snap.data() } as Project;
      setProject(proj);

      // Fetch owner
      const ownerSnap = await getDoc(doc(db, "users", proj.ownerId));
      if (ownerSnap.exists()) setOwner({ uid: ownerSnap.id, ...ownerSnap.data() } as UserProfile);

      // Fetch team members
      if (proj.teamMembers?.length) {
        const members = await Promise.all(
          proj.teamMembers.map(async (uid) => {
            const mSnap = await getDoc(doc(db, "users", uid));
            return mSnap.exists() ? { uid: mSnap.id, ...mSnap.data() } as UserProfile : null;
          })
        );
        setTeamMembers(members.filter(Boolean) as UserProfile[]);
      }

      setLoading(false);
    };
    load();

    // Subscribe to applications
    const unsub = getApplications(projectId, setApplications);
    return unsub;
  }, [projectId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">Loading project...</div>
        </div>
      </Layout>
    );
  }

  if (notFound || !project) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-display text-lg font-semibold mb-2">Project not found</h3>
          <p className="text-muted-foreground text-sm mb-4">This project may have been removed.</p>
          <button onClick={() => navigate("/projects")} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
            Back to Projects
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/projects")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">{project.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">by {project.ownerName}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              project.status === "open" ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-border"
            }`}>
              {project.status}
            </span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>

          {/* Tech Stack */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Tech Stack</p>
            <div className="flex flex-wrap gap-1.5">
              {project.requiredSkills?.map(s => <span key={s} className="skill-tag">{s}</span>)}
            </div>
          </div>

          {/* Owner */}
          {owner && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Project Owner</p>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="font-display text-sm font-bold text-primary">
                    {owner.name?.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{owner.name}</p>
                  <p className="text-xs text-muted-foreground">{owner.department} • Sem {owner.semester}</p>
                </div>
              </div>
            </div>
          )}

          {/* Team Members */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
              Team ({teamMembers.length}/{project.maxTeamSize})
            </p>
            <div className="space-y-2">
              {teamMembers.map(m => (
                <div key={m.uid} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <div className="flex gap-1 mt-0.5">
                      {m.skills?.slice(0, 3).map(s => <span key={s} className="skill-tag text-[10px]">{s}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interested Developers (applications) */}
          {applications.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
                Interested Developers ({applications.length})
              </p>
              <div className="space-y-2">
                {applications.map(app => (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium">{app.applicantName}</p>
                      <p className="text-xs text-muted-foreground">{app.message}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      app.status === "accepted" ? "bg-primary/10 text-primary" :
                      app.status === "rejected" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default ProjectDetail;
