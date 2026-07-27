import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { ArrowRight, Check, Zap, Lock, Code, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs">I</div>
            ImageToURL
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="/api-docs" className="text-muted-foreground hover:text-foreground transition-colors">API</Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Login</Link>
            <Link href="/register" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              Sign Up
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto max-w-5xl px-4 pt-24 pb-16 md:pt-32 md:pb-24 flex flex-col items-center text-center space-y-8">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter sm:text-6xl">
              Upload images. <br className="hidden sm:inline" />
              <span className="text-muted-foreground">Get permanent URLs instantly.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-[42rem] mx-auto leading-normal sm:text-2xl sm:leading-8">
              Fast. Reliable. Developer friendly. Privacy focused.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <a href="#upload" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-12 px-8">
              Upload Image
              <ArrowRight className="ml-2 w-4 h-4" />
            </a>
            <Link href="/api-docs" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-12 px-8">
              View API
            </Link>
          </div>
        </section>

        {/* Upload Section */}
        <section id="upload" className="container mx-auto max-w-4xl px-4 py-12 scroll-mt-24">
          <div className="p-1 rounded-2xl bg-gradient-to-b from-border/50 to-transparent">
            <div className="bg-background rounded-xl p-4 md:p-8 shadow-sm border border-border">
              <UploadDropzone />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto max-w-5xl px-4 py-24 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="text-muted-foreground text-lg">Three simple steps to host your images.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">1</div>
              <h3 className="font-semibold text-xl">Upload</h3>
              <p className="text-muted-foreground">Drag & drop your files or paste from clipboard.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">2</div>
              <h3 className="font-semibold text-xl">Processing</h3>
              <p className="text-muted-foreground">We automatically optimize, resize, and compress your image.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">3</div>
              <h3 className="font-semibold text-xl">Share</h3>
              <p className="text-muted-foreground">Copy your permanent URL, Markdown, or HTML snippet.</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t bg-muted/20">
          <div className="container mx-auto max-w-5xl px-4 py-24 space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need</h2>
              <p className="text-muted-foreground text-lg max-w-[42rem] mx-auto">
                A modern image hosting solution built for speed, reliability, and ease of use.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "Fast CDN delivery", desc: "Images are served from edge nodes close to your users." },
                { icon: Code, title: "Developer API", desc: "Integrate image hosting directly into your app with our REST API." },
                { icon: Lock, title: "Privacy focused", desc: "Automatic EXIF removal and optional password protection." },
                { icon: LayoutDashboard, title: "Dashboard", desc: "Manage, organize, and track your uploads from a clean interface." },
                { icon: Check, title: "Automatic optimization", desc: "WebP conversion and smart compression built-in." },
                { icon: Check, title: "Multiple uploads", desc: "Drag and drop entire folders or multiple files at once." },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="container mx-auto max-w-5xl px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ImageToURL. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
