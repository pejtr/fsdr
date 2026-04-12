import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Video, Flag, Check, X, Eye, AlertTriangle, Shield, Users, 
  BadgeCheck, FileWarning, UserX, Crown, MessageSquare, Gavel, Sparkles,
  TrendingDown, BarChart2, RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [reportFilter, setReportFilter] = useState("all");
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; reportId: number | null }>({ open: false, reportId: null });
  const [reviewNote, setReviewNote] = useState("");
  const [reviewAction, setReviewAction] = useState<"resolved" | "dismissed">("resolved");

  // Existing admin queries
  const { data: pendingVideos, refetch: refetchVideos } = trpc.admin.pendingVideos.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });
  const { data: pendingFlags, refetch: refetchFlags } = trpc.admin.pendingFlags.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // New moderation queries
  const { data: reports = [], refetch: refetchReports } = trpc.moderation.getReports.useQuery(
    { status: reportFilter },
    { enabled: isAuthenticated && user?.role === 'admin' }
  );
  const { data: reportCounts = [] } = trpc.moderation.getReportCounts.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });
  const { data: verificationRequests = [], refetch: refetchVerifications } = trpc.moderation.getVerificationRequests.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });
  const { data: allUsers = [] } = trpc.moderation.getUsers.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated && user?.role === 'admin' }
  );

  // Mutations
  const approveMutation = trpc.admin.approveVideo.useMutation({
    onSuccess: () => { toast.success('Video approved'); refetchVideos(); },
  });
  const rejectMutation = trpc.admin.rejectVideo.useMutation({
    onSuccess: () => { toast.success('Video rejected'); refetchVideos(); },
  });
  const resolveFlagMutation = trpc.admin.resolveFlag.useMutation({
    onSuccess: () => { toast.success('Flag resolved'); refetchFlags(); },
  });
  const reviewReportMutation = trpc.moderation.reviewReport.useMutation({
    onSuccess: () => {
      toast.success('Report reviewed');
      refetchReports();
      setReviewDialog({ open: false, reportId: null });
      setReviewNote("");
    },
  });
  const handleVerificationMutation = trpc.moderation.handleVerification.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.approved ? 'User verified' : 'Verification rejected');
      refetchVerifications();
    },
  });
  const setRoleMutation = trpc.admin.setUserRole.useMutation({
    onSuccess: () => toast.success('Role updated'),
  });
  const banUserMutation = trpc.moderation.banUser.useMutation({
    onSuccess: () => toast.success('User banned'),
  });
  const seedBadgesMutation = trpc.gamification.seedBadges.useMutation({
    onSuccess: () => toast.success('Badge definitions seeded'),
  });

  // Onboarding analytics
  const { data: onboardingAnalytics, refetch: refetchOnboarding } = trpc.onboarding.getAnalytics.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });
  const resetOnboardingMutation = trpc.onboarding.adminReset.useMutation({
    onSuccess: () => { toast.success('Onboarding reset for user'); refetchOnboarding(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const [resetUserId, setResetUserId] = useState('');

  // Calculate counts
  const pendingReportsCount = reportCounts.find((c: any) => c.status === 'pending')?.count || 0;
  const totalReportsCount = reports.length;

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">This page is for administrators only.</p>
          <Link href="/"><Button>Back to Home</Button></Link>
        </main>
      </div>
    );
  }

  const reasonColors: Record<string, string> = {
    spam: "bg-yellow-500/20 text-yellow-400",
    harassment: "bg-red-500/20 text-red-400",
    inappropriate: "bg-orange-500/20 text-orange-400",
    misinformation: "bg-purple-500/20 text-purple-400",
    copyright: "bg-blue-500/20 text-blue-400",
    other: "bg-gray-500/20 text-gray-400",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    reviewed: "bg-blue-500/20 text-blue-400",
    resolved: "bg-green-500/20 text-green-400",
    dismissed: "bg-gray-500/20 text-gray-400",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            <span className="symbiote-text-gradient">Moderation</span> Dashboard
          </h1>
          <Button variant="outline" size="sm" onClick={() => seedBadgesMutation.mutate()}>
            <Crown className="h-4 w-4 mr-2" />
            Seed Badges
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="symbiote-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Pending Videos</p>
                  <p className="text-2xl font-bold mt-1">{pendingVideos?.length || 0}</p>
                </div>
                <Video className="h-8 w-8 text-primary opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card className="symbiote-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Content Reports</p>
                  <p className="text-2xl font-bold mt-1">{pendingReportsCount}</p>
                </div>
                <FileWarning className="h-8 w-8 text-orange-400 opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card className="symbiote-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Verification Requests</p>
                  <p className="text-2xl font-bold mt-1">{verificationRequests.length}</p>
                </div>
                <BadgeCheck className="h-8 w-8 text-green-400 opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card className="symbiote-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Total Users</p>
                  <p className="text-2xl font-bold mt-1">{allUsers.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="w-full justify-start bg-card border border-border mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="reports" className="gap-2">
              <FileWarning className="h-4 w-4" />
              Reports ({pendingReportsCount})
            </TabsTrigger>
            <TabsTrigger value="verification" className="gap-2">
              <BadgeCheck className="h-4 w-4" />
              Verification ({verificationRequests.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Video className="h-4 w-4" />
              Videos ({pendingVideos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="flags" className="gap-2">
              <Flag className="h-4 w-4" />
              Flags ({pendingFlags?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users ({allUsers.length})
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Onboarding
            </TabsTrigger>
          </TabsList>

          {/* Content Reports Tab */}
          <TabsContent value="reports">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-muted-foreground">Filter:</span>
              {["all", "pending", "reviewed", "resolved", "dismissed"].map(s => (
                <Button
                  key={s}
                  variant={reportFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReportFilter(s)}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
            {reports.length > 0 ? (
              <div className="space-y-3">
                {reports.map((report: any) => (
                  <Card key={report.id} className="symbiote-card">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Gavel className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium capitalize">{report.contentType.replace('_', ' ')}</span>
                            <span className="text-muted-foreground">#{report.contentId}</span>
                            <Badge className={reasonColors[report.reason] || ""}>{report.reason}</Badge>
                            <Badge className={statusColors[report.status] || ""}>{report.status}</Badge>
                          </div>
                          {report.description && (
                            <p className="text-sm text-muted-foreground mt-2">{report.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Reported by: {report.reporterName}</span>
                            <span>{new Date(report.createdAt).toLocaleString()}</span>
                            {report.reviewerName && <span>Reviewed by: {report.reviewerName}</span>}
                          </div>
                          {report.reviewNote && (
                            <p className="text-sm mt-2 p-2 bg-secondary/50 rounded">
                              <MessageSquare className="h-3 w-3 inline mr-1" />
                              {report.reviewNote}
                            </p>
                          )}
                        </div>
                        {report.status === 'pending' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-400"
                              onClick={() => {
                                setReviewDialog({ open: true, reportId: report.id });
                                setReviewAction("resolved");
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReviewDialog({ open: true, reportId: report.id });
                                setReviewAction("dismissed");
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="symbiote-card">
                <CardContent className="p-8 text-center">
                  <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-muted-foreground">No reports to review.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Verification Requests Tab */}
          <TabsContent value="verification">
            {verificationRequests.length > 0 ? (
              <div className="space-y-3">
                {verificationRequests.map((req: any) => (
                  <Card key={req.userId} className="symbiote-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                          {req.avatarUrl ? (
                            <img src={req.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Users className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{req.displayName || req.name || `User #${req.userId}`}</h3>
                          <p className="text-sm text-muted-foreground">{req.email || 'No email'}</p>
                          <Badge className="mt-1 bg-yellow-500/20 text-yellow-400">Pending Verification</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-400"
                            onClick={() => handleVerificationMutation.mutate({ userId: req.userId, approved: true })}
                            disabled={handleVerificationMutation.isPending}
                          >
                            <BadgeCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleVerificationMutation.mutate({ userId: req.userId, approved: false })}
                            disabled={handleVerificationMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="symbiote-card">
                <CardContent className="p-8 text-center">
                  <BadgeCheck className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-muted-foreground">No pending verification requests.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            {pendingVideos && pendingVideos.length > 0 ? (
              <div className="space-y-3">
                {pendingVideos.map((video) => (
                  <Card key={video.id} className="symbiote-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-40 h-24 bg-secondary rounded overflow-hidden flex-shrink-0">
                          {video.thumbnailUrl ? (
                            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Video className="h-8 w-8 text-muted-foreground" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{video.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{video.description || 'No description'}</p>
                          <p className="text-xs text-muted-foreground mt-2">Creator ID: {video.creatorId} | {new Date(video.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/video/${video.id}`}><Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />View</Button></Link>
                          <Button variant="outline" size="sm" className="text-green-400" onClick={() => approveMutation.mutate({ videoId: video.id })} disabled={approveMutation.isPending}><Check className="h-4 w-4 mr-1" />Approve</Button>
                          <Button variant="outline" size="sm" className="text-destructive" onClick={() => rejectMutation.mutate({ videoId: video.id })} disabled={rejectMutation.isPending}><X className="h-4 w-4 mr-1" />Reject</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="symbiote-card"><CardContent className="p-8 text-center"><Check className="h-12 w-12 mx-auto mb-4 text-green-500" /><p className="text-muted-foreground">All videos reviewed.</p></CardContent></Card>
            )}
          </TabsContent>

          {/* Flags Tab */}
          <TabsContent value="flags">
            {pendingFlags && pendingFlags.length > 0 ? (
              <div className="space-y-3">
                {pendingFlags.map((flag) => (
                  <Card key={flag.id} className="symbiote-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <AlertTriangle className="h-8 w-8 text-accent flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">Video #{flag.videoId}</h3>
                          <p className="text-sm text-muted-foreground mt-1">Reason: <span className="text-accent capitalize">{flag.reason.replace('_', ' ')}</span></p>
                          {flag.description && <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/video/${flag.videoId}`}><Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />View</Button></Link>
                          <Button variant="outline" size="sm" onClick={() => resolveFlagMutation.mutate({ flagId: flag.id, action: 'dismiss' })}>Dismiss</Button>
                          <Button variant="outline" size="sm" className="text-destructive" onClick={() => resolveFlagMutation.mutate({ flagId: flag.id, action: 'action_taken' })}>Take Action</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="symbiote-card"><CardContent className="p-8 text-center"><Check className="h-12 w-12 mx-auto mb-4 text-green-500" /><p className="text-muted-foreground">No flags to review.</p></CardContent></Card>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="space-y-2">
              {allUsers.map((u: any) => (
                <Card key={u.id} className="symbiote-card">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{u.name?.[0] || '?'}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{u.name || `User #${u.id}`}</span>
                          <Badge variant="outline" className="text-xs capitalize">{u.role}</Badge>
                          {u.bio === '[BANNED]' && <Badge className="bg-red-500/20 text-red-400 text-xs">Banned</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{u.email || 'No email'} | Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Select
                          defaultValue={u.role}
                          onValueChange={(val) => setRoleMutation.mutate({ userId: u.id, role: val as any })}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="creator">Creator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive h-8 text-xs"
                          onClick={() => {
                            if (confirm('Ban this user?')) banUserMutation.mutate({ userId: u.id });
                          }}
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          {/* Onboarding Analytics Tab */}
          <TabsContent value="onboarding">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="symbiote-card">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-[oklch(0.6_0.15_180)]">{onboardingAnalytics?.totalUsers ?? 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total Users</div>
                  </CardContent>
                </Card>
                <Card className="symbiote-card">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-400">{onboardingAnalytics?.completedUsers ?? 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">Completed Onboarding</div>
                  </CardContent>
                </Card>
                <Card className="symbiote-card">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-yellow-400">{onboardingAnalytics?.completionRate ?? 0}%</div>
                    <div className="text-xs text-muted-foreground mt-1">Completion Rate</div>
                  </CardContent>
                </Card>
                <Card className="symbiote-card">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-400">
                      {onboardingAnalytics?.stepStats?.reduce((max: number, s: any) => Math.max(max, s.dropOffRate), 0) ?? 0}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Max Step Drop-off</div>
                  </CardContent>
                </Card>
              </div>

              {/* Step Analytics */}
              <Card className="symbiote-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart2 className="h-4 w-4" /> Step Drop-off Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(onboardingAnalytics?.stepStats ?? []).map((step: any) => (
                      <div key={step.stepId} className="flex items-center gap-3">
                        <div className="w-24 text-xs font-medium capitalize">{step.stepId}</div>
                        <div className="flex-1">
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[oklch(0.6_0.15_180)] rounded-full transition-all"
                              style={{ width: `${step.views > 0 ? Math.round((step.completes / step.views) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground w-28 text-right">
                          {step.views}v / {step.skips}s / {step.completes}c
                        </div>
                        {step.dropOffRate > 30 && (
                          <Badge className="bg-red-500/20 text-red-400 text-xs">
                            <TrendingDown className="h-3 w-3 mr-1" />{step.dropOffRate}% drop
                          </Badge>
                        )}
                      </div>
                    ))}
                    {!onboardingAnalytics?.stepStats?.length && (
                      <p className="text-sm text-muted-foreground text-center py-4">No step data yet. Users need to go through onboarding first.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Admin Reset Tool */}
              <Card className="symbiote-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <RotateCcw className="h-4 w-4" /> Reset User Onboarding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Reset onboarding for a specific user (by User ID) so they see the wizard again on next login.</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="User ID (e.g. 1)"
                      value={resetUserId}
                      onChange={(e) => setResetUserId(e.target.value)}
                      className="max-w-xs"
                      type="number"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const id = parseInt(resetUserId);
                        if (!id) { toast.error('Enter a valid user ID'); return; }
                        if (confirm(`Reset onboarding for user #${id}?`)) {
                          resetOnboardingMutation.mutate({ userId: id });
                          setResetUserId('');
                        }
                      }}
                      disabled={resetOnboardingMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Quick reset from user list:</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {allUsers.slice(0, 10).map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between p-2 rounded bg-secondary/30">
                          <span className="text-xs">{u.name || `User #${u.id}`} <span className="text-muted-foreground">(#{u.id})</span></span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={() => {
                              if (confirm(`Reset onboarding for ${u.name || `User #${u.id}`}?`)) {
                                resetOnboardingMutation.mutate({ userId: u.id });
                              }
                            }}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Reset
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Review Report Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog({ open, reportId: open ? reviewDialog.reportId : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewAction === 'resolved' ? 'Resolve Report' : 'Dismiss Report'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Add a review note (optional)..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog({ open: false, reportId: null })}>Cancel</Button>
            <Button
              variant={reviewAction === 'resolved' ? 'default' : 'outline'}
              onClick={() => {
                if (reviewDialog.reportId) {
                  reviewReportMutation.mutate({
                    reportId: reviewDialog.reportId,
                    status: reviewAction,
                    reviewNote: reviewNote || undefined,
                  });
                }
              }}
              disabled={reviewReportMutation.isPending}
            >
              {reviewAction === 'resolved' ? 'Resolve' : 'Dismiss'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
