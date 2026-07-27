import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { ArrowRight, Check, Zap, Lock, Code, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SlideUp, StaggerContainer, StaggerItem } from "@/components/motion";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-[0.15] pointer-events-none blur-[100px] bg-gradient-to-b from-primary to-transparent dark:opacity-[0.05]" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold tracking-tight text-lg">
            <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs shadow-sm shadow-primary/20">I</div>
            ImageToURL
          </div>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Features</Link>
            {session ? (
              <UserMenu email={session.user.email} />
            ) : (
              <>
                <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
                <Link href="/register" className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-sm shadow-primary/20">
                  Sign Up
                </Link>
              </>
            )}
            <div className="pl-2 border-l border-border/50">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto max-w-5xl px-4 pt-24 pb-16 md:pt-32 md:pb-24 flex flex-col items-center text-center">
          <StaggerContainer className="space-y-6 max-w-3xl flex flex-col items-center">
            <StaggerItem>
              <div className="inline-flex items-center rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-sm text-muted-foreground backdrop-blur-sm mb-4">
                <span className="flex w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                Production Ready Hosting
              </div>
            </StaggerItem>
            
            <StaggerItem>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter sm:text-6xl leading-[1.1]">
                Upload images. <br className="hidden sm:inline" />
                <span className="text-muted-foreground">Get URLs instantly.</span>
              </h1>
            </StaggerItem>
            
            <StaggerItem>
              <p className="text-lg text-muted-foreground max-w-[42rem] mx-auto leading-relaxed sm:text-xl">
                The fastest way to host and share images. Developer friendly API, permanent URLs, and automatic optimization built right in.
              </p>
            </StaggerItem>
            
            <StaggerItem className="w-full flex justify-center pt-4">
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
                <a href="#upload" className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-all bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 hover:scale-105 active:scale-95 h-12 px-8 w-full sm:w-auto">
                  Start Uploading
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
                <Link href="/api-docs" className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-all border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-12 px-8 w-full sm:w-auto">
                  View API Docs
                </Link>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* Upload Section */}
        <section id="upload" className="container mx-auto max-w-4xl px-4 py-12 scroll-mt-24">
          <SlideUp y={40} delay={0.4}>
            <div className="p-[1px] rounded-2xl bg-gradient-to-b from-border/80 to-transparent shadow-2xl shadow-black/5 dark:shadow-black/20">
              <div className="bg-background/80 backdrop-blur-xl rounded-xl p-4 md:p-8 shadow-sm">
                <UploadDropzone />
              </div>
            </div>
          </SlideUp>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="container mx-auto max-w-5xl px-4 py-24">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need</h2>
            <p className="text-muted-foreground text-lg max-w-[42rem] mx-auto">
              A modern image hosting solution built for speed, reliability, and ease of use.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Fast CDN delivery", desc: "Images are served from edge nodes globally." },
              { icon: Code, title: "Developer API", desc: "Integrate hosting directly into your app." },
              { icon: Lock, title: "Privacy focused", desc: "Automatic EXIF removal and secure storage." },
              { icon: LayoutDashboard, title: "Dashboard", desc: "Manage and track your uploads easily." },
              { icon: Check, title: "Auto optimization", desc: "WebP conversion and smart compression." },
              { icon: ArrowRight, title: "Multiple uploads", desc: "Drag and drop entire folders at once." },
            ].map((feature, i) => (
              <SlideUp key={i} delay={0.1 * i} className="group relative p-6 rounded-2xl border bg-background hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </SlideUp>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-12 mt-12">
        <div className="container mx-auto max-w-5xl px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold">
            <div className="w-4 h-4 rounded bg-primary text-primary-foreground flex items-center justify-center text-[8px]">I</div>
            ImageToURL
          </div>
          <p>© {new Date().getFullYear()} ImageToURL. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
