import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Heart, Sparkles, Camera, Video, 
  MessageCircle, Star, TrendingUp, Zap, Music
} from "lucide-react";

// Mock data
const trendingCreators = [
  { id: 1, name: "Alex Nova", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", followers: 25000, verified: true },
  { id: 2, name: "Jamie Sky", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200", followers: 18500, verified: true },
  { id: 3, name: "Riley Moon", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200", followers: 12300, verified: false },
  { id: 4, name: "Casey Star", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200", followers: 9800, verified: true },
];

const trendingContent = [
  { id: 1, title: "Soft Boy Aesthetic Guide", type: "video", views: 45000, likes: 3200 },
  { id: 2, title: "Pastel Outfit Haul", type: "video", views: 32000, likes: 2800 },
  { id: 3, title: "Skincare Routine for Femboys", type: "article", views: 28000, likes: 2100 },
  { id: 4, title: "Voice Training Tips", type: "video", views: 21000, likes: 1900 },
];

export default function FemboyHub() {
  const [activeTab, setActiveTab] = useState("discover");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Zap className="w-3 h-3 mr-1" />
              Femboy Hub
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Embrace Your Aesthetic
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              The ultimate community for femboys. Share your style, connect with others, 
              and discover inspiration from creators around the world.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <Users className="w-4 h-4 mr-2" />
                Join the Community
              </Button>
              <Button size="lg" variant="outline" className="border-purple-500/50 hover:bg-purple-500/10">
                <Video className="w-4 h-4 mr-2" />
                Watch Content
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-2xl mx-auto">
            {[
              { label: "Members", value: "75K+", icon: Users },
              { label: "Creators", value: "500+", icon: Star },
              { label: "Videos", value: "10K+", icon: Video },
              { label: "Daily Posts", value: "2K+", icon: TrendingUp },
            ].map((stat) => (
              <Card key={stat.label} className="bg-card/50 backdrop-blur border-white/10">
                <CardContent className="p-4 text-center">
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-purple-400" />
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
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="creators">Creators</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="connect">Connect</TabsTrigger>
            </TabsList>

            {/* Discover Tab */}
            <TabsContent value="discover" className="space-y-8">
              {/* Categories */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: "Style & Fashion", desc: "Outfit inspiration", icon: Sparkles, color: "from-pink-500 to-rose-500" },
                  { title: "Beauty & Skincare", desc: "Glow up tips", icon: Heart, color: "from-purple-500 to-indigo-500" },
                  { title: "Lifestyle", desc: "Daily vlogs", icon: Camera, color: "from-blue-500 to-cyan-500" },
                  { title: "Music & Dance", desc: "Performance art", icon: Music, color: "from-green-500 to-teal-500" },
                ].map((item) => (
                  <Card key={item.title} className="bg-card/50 border-white/10 hover:border-purple-500/50 transition-all cursor-pointer group">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Featured Content */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Featured Content</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {trendingContent.map((content) => (
                    <Card key={content.id} className="bg-card/50 border-white/10 hover:border-purple-500/50 transition-colors overflow-hidden">
                      <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        {content.type === "video" ? (
                          <Video className="w-12 h-12 text-purple-400" />
                        ) : (
                          <Camera className="w-12 h-12 text-purple-400" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-2 text-xs">
                          {content.type}
                        </Badge>
                        <h3 className="font-semibold mb-2 line-clamp-2">{content.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{content.views.toLocaleString()} views</span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {content.likes.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Creators Tab */}
            <TabsContent value="creators" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Top Creators</h2>
                <Button variant="outline">Become a Creator</Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {trendingCreators.map((creator) => (
                  <Card key={creator.id} className="bg-card/50 border-white/10 hover:border-purple-500/50 transition-colors">
                    <CardContent className="p-6 text-center">
                      <div className="relative inline-block mb-4">
                        <img 
                          src={creator.avatar} 
                          alt={creator.name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-purple-500/30"
                        />
                        {creator.verified && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                            <Star className="w-4 h-4 text-white fill-white" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{creator.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {creator.followers.toLocaleString()} followers
                      </p>
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500">
                        <Heart className="w-4 h-4 mr-2" />
                        Follow
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Trending Tab */}
            <TabsContent value="trending" className="space-y-6">
              <h2 className="text-2xl font-bold">Trending Now</h2>
              <div className="space-y-4">
                {trendingContent.map((content, index) => (
                  <Card key={content.id} className="bg-card/50 border-white/10 hover:border-purple-500/50 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="text-3xl font-bold text-purple-400 w-12 text-center">
                        #{index + 1}
                      </div>
                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
                        <Video className="w-8 h-8 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{content.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{content.views.toLocaleString()} views</span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {content.likes.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline">Watch</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Connect Tab */}
            <TabsContent value="connect" className="space-y-6">
              <Card className="bg-card/50 border-white/10 p-8 text-center">
                <Heart className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <h3 className="text-xl font-bold mb-2">Find Your People</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Connect with other femboys, make friends, or find romantic connections 
                  in our safe and welcoming community.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/dating">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                      <Heart className="w-4 h-4 mr-2" />
                      Start Matching
                    </Button>
                  </Link>
                  <Link href="/forum">
                    <Button variant="outline">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Join Forums
                    </Button>
                  </Link>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Join the Femboy Revolution</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Be part of a growing community that celebrates self-expression, 
            creativity, and authenticity. Your journey starts here.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            Create Your Profile
          </Button>
        </div>
      </section>
    </div>
  );
}
