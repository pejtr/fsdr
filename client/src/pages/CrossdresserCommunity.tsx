import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Heart, Sparkles, BookOpen, ShoppingBag, 
  Camera, MessageCircle, Star, TrendingUp, Crown
} from "lucide-react";

// Mock data for community showcase
const featuredMembers = [
  { id: 1, name: "Sophie Rose", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200", followers: 12500, level: "Mentor" },
  { id: 2, name: "Emma Grace", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200", followers: 8900, level: "Experienced" },
  { id: 3, name: "Lily Chen", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200", followers: 6200, level: "Intermediate" },
];

const styleGuides = [
  { id: 1, title: "Beginner's Guide to Crossdressing", category: "Getting Started", readTime: 15, views: 45000, isPremium: false },
  { id: 2, title: "Makeup Essentials for Feminine Look", category: "Makeup", readTime: 20, views: 32000, isPremium: false },
  { id: 3, title: "Finding Your Perfect Wig", category: "Wigs & Hair", readTime: 12, views: 28000, isPremium: false },
  { id: 4, title: "Voice Feminization Techniques", category: "Voice", readTime: 25, views: 21000, isPremium: true },
  { id: 5, title: "Building a Feminine Wardrobe", category: "Fashion", readTime: 18, views: 19000, isPremium: false },
  { id: 6, title: "Advanced Contouring Secrets", category: "Makeup", readTime: 30, views: 15000, isPremium: true },
];

const affiliateProducts = [
  { id: 1, name: "Premium Lace Front Wig", price: "€89.99", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200", rating: 4.8 },
  { id: 2, name: "Silicone Breast Forms", price: "€129.99", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200", rating: 4.9 },
  { id: 3, name: "Full Body Shaper", price: "€79.99", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200", rating: 4.7 },
  { id: 4, name: "Professional Makeup Kit", price: "€149.99", image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=200", rating: 4.6 },
];

export default function CrossdresserCommunity() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-teal-500/20" />
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }} />
        
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-pink-500/20 text-pink-300 border-pink-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Crossdresser Community
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
              Express Your True Self
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of crossdressers sharing their journey, style tips, and transformation stories. 
              A safe, supportive community where you can be yourself.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                <Users className="w-4 h-4 mr-2" />
                Join Community
              </Button>
              <Button size="lg" variant="outline" className="border-pink-500/50 hover:bg-pink-500/10">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Guides
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-2xl mx-auto">
            {[
              { label: "Members", value: "50K+", icon: Users },
              { label: "Style Guides", value: "200+", icon: BookOpen },
              { label: "Daily Active", value: "5K+", icon: TrendingUp },
              { label: "Success Stories", value: "10K+", icon: Heart },
            ].map((stat) => (
              <Card key={stat.label} className="bg-card/50 backdrop-blur border-white/10">
                <CardContent className="p-4 text-center">
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-pink-400" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 bg-card/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="guides">Style Guides</TabsTrigger>
              <TabsTrigger value="shop">Shop</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Featured Members */}
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  Featured Members
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {featuredMembers.map((member) => (
                    <Card key={member.id} className="bg-card/50 border-white/10 hover:border-pink-500/50 transition-colors">
                      <CardContent className="p-6 text-center">
                        <div className="relative inline-block mb-4">
                          <img 
                            src={member.avatar} 
                            alt={member.name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-pink-500/30"
                          />
                          <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-pink-500">
                            {member.level}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{member.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {member.followers.toLocaleString()} followers
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          <Heart className="w-4 h-4 mr-2" />
                          Follow
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: "Dating & Connect", desc: "Find like-minded people", icon: Heart, color: "from-pink-500 to-rose-500", href: "/dating" },
                  { title: "Style Tutorials", desc: "Learn from experts", icon: Sparkles, color: "from-purple-500 to-indigo-500", href: "/guides" },
                  { title: "Community Forum", desc: "Join discussions", icon: MessageCircle, color: "from-teal-500 to-cyan-500", href: "/forum" },
                  { title: "Photo Gallery", desc: "Share your looks", icon: Camera, color: "from-orange-500 to-amber-500", href: "/gallery" },
                ].map((item) => (
                  <Link key={item.title} href={item.href}>
                    <Card className="bg-card/50 border-white/10 hover:border-white/30 transition-all cursor-pointer group">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>

            {/* Style Guides Tab */}
            <TabsContent value="guides" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Style Guides & Tutorials</h2>
                <Button variant="outline">View All</Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {styleGuides.map((guide) => (
                  <Card key={guide.id} className="bg-card/50 border-white/10 hover:border-pink-500/50 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="mb-2">{guide.category}</Badge>
                        {guide.isPremium && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                      <CardDescription>
                        {guide.readTime} min read • {guide.views.toLocaleString()} views
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant={guide.isPremium ? "default" : "outline"}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        {guide.isPremium ? "Unlock with Premium" : "Read Guide"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Shop Tab */}
            <TabsContent value="shop" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Recommended Products</h2>
                <Button variant="outline">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {affiliateProducts.map((product) => (
                  <Card key={product.id} className="bg-card/50 border-white/10 hover:border-pink-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-muted">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-semibold mb-1">{product.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center text-yellow-400">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm ml-1">{product.rating}</span>
                        </div>
                        <span className="text-lg font-bold text-pink-400">{product.price}</span>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500">
                        Shop Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/30">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-2">Earn While You Shop</h3>
                  <p className="text-muted-foreground mb-4">
                    Join our affiliate program and earn commissions on every sale you refer.
                  </p>
                  <Button variant="outline" className="border-pink-500/50">
                    Learn More About Affiliates
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Community Members</h2>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500">
                  <Heart className="w-4 h-4 mr-2" />
                  Find Matches
                </Button>
              </div>
              <Card className="bg-card/50 border-white/10 p-8 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-pink-400" />
                <h3 className="text-xl font-bold mb-2">Join Our Community</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your profile to connect with other crossdressers, share your journey, 
                  and find supportive friends or romantic connections.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-500">
                    Create Profile
                  </Button>
                  <Button variant="outline">
                    Browse Anonymously
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-teal-500/10">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of members who have found confidence, community, and self-expression 
            through crossdressing. Your transformation starts here.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline">
              <Crown className="w-4 h-4 mr-2" />
              View Premium Plans
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
