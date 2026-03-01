import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Zap, Target, ArrowRight, Code } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative container mx-auto px-4 py-20">
        {/* Nav */}
        <nav className="flex items-center justify-between mb-24">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">&lt;❤&gt;</span>
            </div>
            <span className="font-display font-bold text-xl gradient-text">CodeCupid</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              Sign In
            </Link>
            <Link to="/signup"
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold btn-primary-glow hover:brightness-110 transition-all">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Zap className="w-3.5 h-3.5" /> Where Code Meets Collaboration
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              Find Your <span className="gradient-text">Perfect Tech Match</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Swipe through developer profiles, match with teammates who share your tech stack, and build something amazing together.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/signup"
                className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 btn-primary-glow hover:brightness-110 transition-all text-lg">
                Join CodeCupid <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/discover"
                className="px-8 py-3.5 rounded-xl bg-secondary text-secondary-foreground font-semibold flex items-center gap-2 hover:brightness-110 transition-all text-lg border border-border">
                Explore Developers
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Features */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-3 gap-6 mt-28 max-w-4xl mx-auto"
        >
          {[
            { icon: Heart, title: "Skill-Based Matching", desc: "Get paired with developers who complement your tech stack perfectly." },
            { icon: Target, title: "Swipe to Connect", desc: "Tinder-style cards make finding teammates fun and effortless." },
            { icon: Zap, title: "Help Wanted Board", desc: "Post project ideas and recruit the exact roles you need." },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass-card-hover rounded-xl p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-20 text-sm text-muted-foreground">
          © 2026 CodeCupid. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Index;
