import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Menu, X, User, Settings, LogOut, LayoutDashboard, Heart, Shield, Users, Wallet, Youtube, Bell, MessageSquare, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fetch unread notification count
  const { data: unreadCount = 0, refetch: refetchUnread } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 30000 }
  );

  // Fetch notifications
  const { data: notifications = [], refetch: refetchNotifications } = trpc.notifications.getAll.useQuery(
    { limit: 10, unreadOnly: false },
    { enabled: isAuthenticated && notificationsOpen }
  );

  // Mark notification as read
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchNotifications();
    },
  });

  // Mark all as read
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchNotifications();
    },
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markReadMutation.mutate({ notificationId: notification.id });
    }
    if (notification.linkUrl) {
      setLocation(notification.linkUrl);
    }
    setNotificationsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_message':
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case 'new_comment':
        return <MessageSquare className="h-4 w-4 text-green-400" />;
      case 'new_like':
        return <Heart className="h-4 w-4 text-pink-400" />;
      case 'new_follower':
        return <Users className="h-4 w-4 text-purple-400" />;
      case 'new_subscriber':
        return <Heart className="h-4 w-4 text-primary" />;
      case 'payout':
        return <Wallet className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const navLinks = [
    { href: "/browse", label: "Procházet" },
    { href: "/crossdresser", label: "Crossdresser" },
    { href: "/femboy", label: "Femboy Hub" },
    { href: "/gallery", label: "Galerie" },
    ...(isAuthenticated && user?.role === 'creator' ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(isAuthenticated ? [{ href: "/subscriptions", label: "Odběry" }] : []),
    ...(user?.role === 'admin' ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-[oklch(0.6_0.15_180)]/20">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <span className="symbiote-text-gradient font-bold text-2xl cursor-pointer">
              FEMSIDER
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  location === link.href ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                {/* Notification Bell */}
                <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge 
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs symbiote-gradient border-0"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="end">
                    <div className="flex items-center justify-between p-2 border-b border-border">
                      <span className="font-semibold">Notifikace</span>
                      {unreadCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-primary"
                          onClick={() => markAllReadMutation.mutate()}
                        >
                          Označit vše jako přečtené
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="h-[300px]">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Žádné notifikace
                        </div>
                      ) : (
                        notifications.map((notification: any) => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors ${
                              !notification.isRead ? 'bg-primary/5' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex gap-3">
                              <div className="mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                                  {notification.title}
                                </p>
                                {notification.content && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                    {notification.content}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(notification.createdAt), { 
                                    addSuffix: true, 
                                    locale: cs 
                                  })}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </ScrollArea>
                    <div className="p-2 border-t border-border">
                      <Link href="/notifications">
                        <Button variant="ghost" size="sm" className="w-full text-primary">
                          Zobrazit všechny notifikace
                        </Button>
                      </Link>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Messages shortcut */}
                <Link href="/messages">
                  <Button variant="ghost" size="icon">
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </Link>

                {/* Video Recreate shortcut for creators */}
                {user?.role === 'creator' && (
                  <Link href="/video-recreate">
                    <Button variant="ghost" size="icon">
                      <Video className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-[oklch(0.6_0.15_180)]/50 symbiote-glow">
                      <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatarUrl || undefined} />
                      <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.name || 'Uživatel'}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {user?.role === 'creator' && (
                    <Link href="/dashboard">
                      <DropdownMenuItem className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <Link href="/subscriptions">
                    <DropdownMenuItem className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      Moje odběry
                    </DropdownMenuItem>
                  </Link>
                  {!user?.isAgeVerified && (
                    <Link href="/verify-age">
                      <DropdownMenuItem className="cursor-pointer text-accent">
                        <Shield className="mr-2 h-4 w-4" />
                        Ověřit věk
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <Link href="/affiliate">
                    <DropdownMenuItem className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      Affiliate program
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/payouts">
                    <DropdownMenuItem className="cursor-pointer">
                      <Wallet className="mr-2 h-4 w-4" />
                      Výplaty
                    </DropdownMenuItem>
                  </Link>
                  {user?.role === 'creator' && (
                    <>
                      <Link href="/youtube-studio">
                        <DropdownMenuItem className="cursor-pointer">
                          <Youtube className="mr-2 h-4 w-4 text-red-500" />
                          YouTube Studio
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/video-recreate">
                        <DropdownMenuItem className="cursor-pointer">
                          <Video className="mr-2 h-4 w-4 text-purple-500" />
                          Video Recreate
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Nastavení
                    </DropdownMenuItem>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin panel
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Odhlásit se
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="symbiote-gradient text-white border-0">
                  Přihlásit se
                </Button>
              </a>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`block px-4 py-2 rounded-md transition-colors ${
                      location === link.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
