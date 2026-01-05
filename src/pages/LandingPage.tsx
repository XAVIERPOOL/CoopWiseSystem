import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Shield, BookOpen, ArrowRight, CheckCircle, Truck, Wheat, Factory, Home, Briefcase, Heart } from 'lucide-react';
import nccdoLogo from '../../attached_assets/462853451_531127746179171_9134722409661138434_n_1762934895081.jpg';

const LandingPage = () => {
  const benefits = [
    {
      icon: Users,
      title: "Community Building",
      description: "Connect with like-minded individuals and build strong community relationships through cooperative membership."
    },
    {
      icon: TrendingUp,
      title: "Economic Growth",
      description: "Access to capital, shared resources, and collective bargaining power to improve economic opportunities."
    },
    {
      icon: Shield,
      title: "Financial Security",
      description: "Benefit from shared risk, mutual support, and financial services designed for member welfare."
    },
    {
      icon: BookOpen,
      title: "Education & Training",
      description: "Continuous learning opportunities through our comprehensive training and development programs."
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Learn About Cooperatives",
      description: "Understand the principles, benefits, and requirements of forming a cooperative organization."
    },
    {
      step: "2",
      title: "Gather Interested Members",
      description: "Form a group of at least 15 interested individuals who share common goals and interests."
    },
    {
      step: "3",
      title: "Attend Training Sessions",
      description: "Participate in our cooperative education and training programs to build necessary skills."
    },
    {
      step: "4",
      title: "Develop Business Plan",
      description: "Create a comprehensive business plan with financial projections and operational structure."
    },
    {
      step: "5",
      title: "Complete Registration",
      description: "Submit required documents and complete the legal registration process with our office."
    }
  ];

  const seminarCategories = [
    {
      icon: Truck,
      title: "Transportation Cooperatives",
      description: "Learn to establish transport cooperatives for jeepneys, buses, tricycles, and other public utility vehicles.",
      topics: ["Fleet Management", "Route Planning", "Member Safety", "Regulatory Compliance"]
    },
    {
      icon: Wheat,
      title: "Agricultural Cooperatives",
      description: "Training on farming cooperatives, crop production, livestock management, and agricultural marketing.",
      topics: ["Crop Production", "Livestock Management", "Marketing Strategies", "Farm Equipment Sharing"]
    },
    {
      icon: Factory,
      title: "Industrial Cooperatives",
      description: "Workshops for manufacturing, processing, and industrial production cooperative enterprises.",
      topics: ["Production Management", "Quality Control", "Supply Chain", "Technology Adoption"]
    },
    {
      icon: Home,
      title: "Housing Cooperatives",
      description: "Seminars on community housing projects, home ownership programs, and construction cooperatives.",
      topics: ["Housing Development", "Construction Management", "Financing Options", "Community Planning"]
    },
    {
      icon: Briefcase,
      title: "Service Cooperatives",
      description: "Training for service-oriented cooperatives including cleaning, security, and maintenance services.",
      topics: ["Service Standards", "Client Management", "Team Coordination", "Business Development"]
    },
    {
      icon: Heart,
      title: "Health & Wellness Cooperatives",
      description: "Programs for healthcare cooperatives, wellness centers, and community health initiatives.",
      topics: ["Healthcare Management", "Community Health", "Wellness Programs", "Health Insurance"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-surface sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={nccdoLogo} 
                alt="NCCDO Logo" 
                className="h-14 w-14 object-cover rounded-full shadow-soft ring-2 ring-white/50 dark:ring-white/20"
              />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground leading-tight tracking-tight">City Cooperative Development Office</h1>
              <p className="text-sm text-muted-foreground font-medium">City of Naga</p>
            </div>
          </div>
          <Link to="/login">
            <Button variant="default" size="default" data-testid="button-login">
              Login
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="gradient-hero-radial py-24 px-4">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[800px] h-[800px] rounded-full bg-white/5 blur-3xl" />
          </div>
          
          <div className="container mx-auto text-center max-w-4xl relative z-10">
            <div className="flex justify-center mb-10">
              <div className="relative">
                <div className="absolute -inset-4 bg-white/20 rounded-full blur-2xl" />
                <img 
                  src={nccdoLogo} 
                  alt="NCCDO - City Cooperative Development Office" 
                  className="relative h-44 w-44 object-cover rounded-full shadow-soft-lg ring-4 ring-white/30"
                />
              </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight tracking-tight">
              Building Stronger Communities Through Cooperation
            </h2>
            <p className="text-xl text-white/85 mb-10 max-w-2xl mx-auto leading-relaxed">
              The City Cooperative Development Office (NCCDO) empowers communities by facilitating the formation and development of cooperatives that promote economic growth, social development, and mutual prosperity in Naga City.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 shadow-soft font-semibold" data-testid="button-get-started">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10 backdrop-blur-sm" data-testid="button-learn-more">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 gradient-subtle">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">What We Do</h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our office serves as the primary government agency responsible for promoting, organizing, and developing cooperatives across the region. We provide comprehensive support services to help communities establish successful cooperative enterprises.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center glass-card hover:shadow-soft transition-all duration-300 border-border/50">
                <CardHeader className="pb-2">
                  <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-4">
                    <benefit.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">Benefits of Joining a Cooperative</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Democratic Control</h4>
                    <p className="text-muted-foreground leading-relaxed">One member, one vote ensures equal participation in decision-making processes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Economic Benefits</h4>
                    <p className="text-muted-foreground leading-relaxed">Share in profits, lower costs through bulk purchasing, and access to credit facilities.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Social Development</h4>
                    <p className="text-muted-foreground leading-relaxed">Build social capital, strengthen community bonds, and promote collective action.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Capacity Building</h4>
                    <p className="text-muted-foreground leading-relaxed">Access to training programs, technical assistance, and educational resources.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-strong p-10 rounded-xl">
              <h4 className="text-2xl font-semibold mb-4">Ready to Join?</h4>
              <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                Discover how cooperative membership can transform your community and create lasting positive impact through collective action and shared prosperity.
              </p>
              <Link to="/login">
                <Button size="lg" className="w-full shadow-soft">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/40">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">How to Start a Cooperative</h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Follow these essential steps to establish your cooperative organization with the support of our development office.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="relative overflow-hidden glass-card border-border/50 hover:shadow-soft transition-all duration-300">
                <CardHeader>
                  <div className="absolute top-4 right-4 w-10 h-10 gradient-hero text-white rounded-full flex items-center justify-center text-sm font-bold shadow-soft">
                    {step.step}
                  </div>
                  <CardTitle className="text-lg pr-14 font-semibold">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">{step.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-14">
            <p className="text-muted-foreground mb-6 text-lg">
              Need assistance with any of these steps? Our team is here to guide you through the entire process.
            </p>
            <Link to="/login">
              <Button size="lg" className="shadow-soft">
                Contact Our Office
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Training Seminars & Programs</h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We offer specialized seminars and training programs tailored to different cooperative sectors. Join our comprehensive educational programs designed to help you succeed in your cooperative venture.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {seminarCategories.map((category, index) => (
              <Card key={index} className="h-full glass-card border-border/50 hover:shadow-soft transition-all duration-300 group">
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/15 to-secondary/15 rounded-full flex items-center justify-center mb-4 group-hover:from-primary/25 group-hover:to-secondary/25 transition-all duration-300">
                    <category.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-2 font-semibold">{category.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <h5 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Key Topics:</h5>
                    <ul className="space-y-2">
                      {category.topics.map((topic, topicIndex) => (
                        <li key={topicIndex} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-14">
            <div className="glass-strong p-10 rounded-xl max-w-2xl mx-auto">
              <h4 className="text-2xl font-semibold mb-4">Ready to Join Our Training Programs?</h4>
              <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                Enroll in our comprehensive seminars and gain the knowledge and skills needed to build and manage successful cooperatives in your chosen sector.
              </p>
              <Link to="/login">
                <Button size="lg" className="shadow-soft">
                  Register for Seminars
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-muted/30 py-10 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img 
                src={nccdoLogo} 
                alt="NCCDO Logo" 
                className="h-12 w-12 object-cover rounded-full shadow-soft ring-2 ring-white/50 dark:ring-white/20"
              />
              <div className="text-left">
                <p className="font-semibold">City Cooperative Development Office</p>
                <p className="text-sm text-muted-foreground">NCCDO 2021 - City of Naga</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              2024 NCCDO. Building stronger communities through cooperation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
