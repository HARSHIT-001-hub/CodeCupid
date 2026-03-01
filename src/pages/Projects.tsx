import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  createProject, getProjects, applyToProject, getApplications,
  handleApplication, Project, Application, getUsers,
} from "@/services/firestore";
import { UserProfile } from "@/context/AuthContext";
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Layout from "@/components/Layout";
import RiskScoreDisplay from "@/components/RiskScoreDisplay";
import TeamCoverageGrid from "@/components/TeamCoverageGrid";
import MilestoneTracker from "@/components/MilestoneTracker";
import SmartTeamBuilder from "@/components/SmartTeamBuilder";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Send, X, Check, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { SKILLS } from "@/data/constants";
import { toast } from "sonner";
import {
  calcMarketSaturation, calcTechFeasibility, calcExecutionPotential,
  calcRiskScore, analyzeTeamCoverage, calcTeamCoverageScore,
  calcTeamStrengthIndex,
} from "@/utils/scoring";

const Projects = () => {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [posting, setPosting] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [applications, setApplications] = useState<Record<string, Application[]>>({});
  const [applyMessage, setApplyMessage] = useState("");
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [teamProfiles, setTeamProfiles] = useState<Record<string, UserProfile[]>>({});
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Subscribe to projects
  useEffect(() => {
    const unsub = getProjects(setProjects);
    return unsub;
  }, []);

  // Fetch all users for scoring
  useEffect(() => {
    getUsers().then(setAllUsers);
  }, []);

  // Load team member profiles when projects change
  useEffect(() => {
    projects.forEach(async (p) => {
      if (p.teamMembers?.length > 0) {
        const profiles = allUsers.filter((u) => p.teamMembers.includes(u.uid));
        setTeamProfiles((prev) => ({ ...prev, [p.id]: profiles }));
      }
    });
  }, [projects, allUsers]);

  // Load applications when expanding a project
  useEffect(() => {
    if (!expandedProject) return;
    const unsub = getApplications(expandedProject, (apps) => {
      setApplications((prev) => ({ ...prev, [expandedProject]: apps }));
    });
    return unsub;
  }, [expandedProject]);

  const handlePost = async () => {
    if (!profile || !title.trim()) return;
    setPosting(true);
    try {
      // Calculate validation scores
      const ownerSkills = profile.skills || [];
      const marketSaturation = calcMarketSaturation(requiredSkills, projects);
      const techFeasibility = calcTechFeasibility(ownerSkills, requiredSkills);
      const executionPotential = calcExecutionPotential(requiredSkills.length, maxTeamSize, techFeasibility);
      const riskScore = calcRiskScore(marketSaturation, techFeasibility, executionPotential);

      await createProject({
        title: title.trim(),
        description: description.trim(),
        requiredSkills,
        maxTeamSize,
        status: "open",
        ownerId: profile.uid,
        ownerName: profile.name,
        teamMembers: [profile.uid],
      });
      toast.success("Project posted!");
      setTitle("");
      setDescription("");
      setRequiredSkills([]);
      setMaxTeamSize(4);
      setShowForm(false);
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    }
    setPosting(false);
  };

  const handleApply = async (projectId: string) => {
    if (!profile) return;
    try {
      await applyToProject(projectId, profile.uid, profile.name, applyMessage || "I'd love to join!");
      toast.success("Application sent!");
      setApplyingTo(null);
      setApplyMessage("");
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    }
  };

  const handleDecision = async (projectId: string, appId: string, applicantId: string, decision: "accepted" | "rejected") => {
    try {
      await handleApplication(projectId, appId, applicantId, decision);
      toast.success(decision === "accepted" ? "Accepted! Group chat created." : "Application rejected.");
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    }
  };

  const handleTeamInvite = async (projectId: string, uid: string) => {
    try {
      await updateDoc(doc(db, "projects", projectId), {
        teamMembers: arrayUnion(uid),
      });
      toast.success("Member added to team!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSkill = (skill: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Compute scores for a project
  const getProjectScores = (project: Project) => {
    const owner = allUsers.find((u) => u.uid === project.ownerId);
    const ownerSkills = owner?.skills || [];
    const marketSaturation = calcMarketSaturation(project.requiredSkills || [], projects.filter((p) => p.id !== project.id));
    const techFeasibility = calcTechFeasibility(ownerSkills, project.requiredSkills || []);
    const executionPotential = calcExecutionPotential((project.requiredSkills || []).length, project.maxTeamSize, techFeasibility);
    const riskScore = calcRiskScore(marketSaturation, techFeasibility, executionPotential);
    return { marketSaturation, techFeasibility, executionPotential, riskScore };
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Help Wanted</h1>
            <p className="text-sm text-muted-foreground">Find projects or post your own</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold btn-primary-glow hover:brightness-110 transition-all"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "Post Project"}
          </button>
        </div>

        {/* Post Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
              <div className="glass-card rounded-xl p-6 space-y-4">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Project Title"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your project idea..." rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Required Skills</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SKILLS.map(skill => (
                      <button key={skill} onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          requiredSkills.includes(skill)
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-secondary text-muted-foreground border border-border hover:border-primary/30"
                        }`}>
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Max Team Size</label>
                  <input type="number" min={2} max={10} value={maxTeamSize} onChange={e => setMaxTeamSize(Number(e.target.value))}
                    className="w-24 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>

                {/* Live Risk Preview */}
                {requiredSkills.length > 0 && profile && (
                  <RiskScoreDisplay
                    riskScore={calcRiskScore(
                      calcMarketSaturation(requiredSkills, projects),
                      calcTechFeasibility(profile.skills || [], requiredSkills),
                      calcExecutionPotential(requiredSkills.length, maxTeamSize, calcTechFeasibility(profile.skills || [], requiredSkills))
                    )}
                    marketSaturation={calcMarketSaturation(requiredSkills, projects)}
                    techFeasibility={calcTechFeasibility(profile.skills || [], requiredSkills)}
                    executionPotential={calcExecutionPotential(requiredSkills.length, maxTeamSize, calcTechFeasibility(profile.skills || [], requiredSkills))}
                  />
                )}

                <button onClick={handlePost} disabled={posting || !title.trim()}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold btn-primary-glow disabled:opacity-50">
                  {posting ? "Publishing..." : "Publish Project"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project Cards */}
        <div className="space-y-6">
          {projects.map((project, i) => {
            const isOwner = project.ownerId === profile?.uid;
            const isExpanded = expandedProject === project.id;
            const apps = applications[project.id] || [];
            const hasApplied = apps.some(a => a.applicantId === profile?.uid);
            const scores = getProjectScores(project);
            const team = teamProfiles[project.id] || [];
            const coverage = analyzeTeamCoverage(team, project.requiredSkills || []);
            const coverageScore = calcTeamCoverageScore(coverage);
            const strengthIndex = calcTeamStrengthIndex(team, coverageScore);

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card-hover rounded-xl p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{project.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        project.status === "open"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">by {project.ownerName}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {project.teamMembers?.length || 1}/{project.maxTeamSize}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>

                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Tech Stack</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.requiredSkills?.map(s => <span key={s} className="skill-tag">{s}</span>)}
                  </div>
                </div>

                {/* Analytics Panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <RiskScoreDisplay {...scores} />
                  {team.length > 0 && (
                    <TeamCoverageGrid coverage={coverage} coverageScore={coverageScore} strengthIndex={strengthIndex} />
                  )}
                </div>

                {/* Milestone Tracker */}
                <MilestoneTracker projectId={project.id} teamMembers={project.teamMembers || []} isOwner={isOwner} />

                {/* Smart Team Builder (owner only) */}
                {isOwner && project.status === "open" && (
                  <SmartTeamBuilder
                    projectId={project.id}
                    existingMembers={project.teamMembers || []}
                    onInvite={(uid) => handleTeamInvite(project.id, uid)}
                  />
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  {isOwner ? (
                    <button onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                      className="flex items-center gap-1 text-sm text-primary font-medium">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {apps.length > 0 ? `${apps.length} Applications` : "View Applications"}
                    </button>
                  ) : project.status === "open" ? (
                    applyingTo === project.id ? (
                      <div className="flex-1 flex gap-2">
                        <input value={applyMessage} onChange={e => setApplyMessage(e.target.value)}
                          placeholder="Why do you want to join?"
                          className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                        <button onClick={() => handleApply(project.id)}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium btn-primary-glow">
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setApplyingTo(null)} className="px-2 text-muted-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => hasApplied ? null : setApplyingTo(project.id)}
                        disabled={hasApplied}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          hasApplied
                            ? "bg-primary/10 text-primary cursor-default"
                            : "bg-primary text-primary-foreground hover:brightness-110 btn-primary-glow"
                        }`}
                      >
                        {hasApplied ? <>Applied ✓</> : <><Send className="w-3.5 h-3.5" /> Apply</>}
                      </button>
                    )
                  ) : (
                    <span className="text-sm text-muted-foreground">Team is full</span>
                  )}
                </div>

                {/* Applications (owner view) */}
                <AnimatePresence>
                  {isOwner && isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-2">
                      {apps.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No applications yet.</p>
                      ) : (
                        apps.map((app) => (
                          <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                            <div>
                              <p className="text-sm font-medium">{app.applicantName}</p>
                              <p className="text-xs text-muted-foreground">{app.message}</p>
                            </div>
                            {app.status === "pending" ? (
                              <div className="flex gap-1.5">
                                <button onClick={() => handleDecision(project.id, app.id, app.applicantId, "accepted")}
                                  className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDecision(project.id, app.id, app.applicantId, "rejected")}
                                  className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                app.status === "accepted" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                              }`}>
                                {app.status}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {projects.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="font-display text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-sm">Be the first to post a project idea!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Projects;
