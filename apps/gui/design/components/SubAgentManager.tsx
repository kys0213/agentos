import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { 
  Bot, 
  Search, 
  Settings, 
  MessageSquare,
  CheckCircle,
  Clock,
  MinusCircle,
  Play,
  Pause,
  Square,
  Zap,
  Database,
  Plus,
  Filter,
  Users,
  Activity,
  TrendingUp,
  BarChart3,
  Info,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  Wand2
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "active" | "idle" | "inactive";
  preset: string;
  avatar?: string;
  lastUsed?: Date;
  usageCount: number;
  tags?: string[];
}

interface SubAgentManagerProps {
  agents: Agent[];
  onUpdateAgentStatus: (agentId: string, newStatus: "active" | "idle" | "inactive") => void;
  onOpenChat: (agentId: number, agentName: string, agentPreset: string) => void;
  onCreateAgent?: () => void;
}

export function SubAgentManager({ agents, onUpdateAgentStatus, onOpenChat, onCreateAgent }: SubAgentManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("agents");
  const [showStatusGuide, setShowStatusGuide] = useState(false);

  const categories = [
    { id: "all", label: "All Categories", count: agents.length },
    { id: "research", label: "Research", count: agents.filter(a => a.category === "research").length },
    { id: "development", label: "Development", count: agents.filter(a => a.category === "development").length },
    { id: "creative", label: "Creative", count: agents.filter(a => a.category === "creative").length },
    { id: "analytics", label: "Analytics", count: agents.filter(a => a.category === "analytics").length },
  ];

  const statuses = [
    { id: "all", label: "All Status", count: agents.length },
    { id: "active", label: "Active", count: agents.filter(a => a.status === "active").length },
    { id: "idle", label: "Idle", count: agents.filter(a => a.status === "idle").length },
    { id: "inactive", label: "Inactive", count: agents.filter(a => a.status === "inactive").length },
  ];

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || agent.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || agent.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "research": return <Search className="w-4 h-4" />;
      case "development": return <Bot className="w-4 h-4" />;
      case "creative": return <Zap className="w-4 h-4" />;
      case "analytics": return <Database className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string, withTooltip: boolean = false) => {
    const getTooltipContent = (status: string) => {
      switch (status) {
        case "active":
          return "Automatically participate in conversations via orchestrator";
        case "idle":
          return "Available for explicit @mention calls only";
        case "inactive":
          return "Completely disabled, cannot be called";
        default:
          return "";
      }
    };

    const badgeContent = (() => {
      switch (status) {
        case "active":
          return (
            <Badge className="gap-1 status-active">
              <CheckCircle className="w-3 h-3" />
              Active
            </Badge>
          );
        case "idle":
          return (
            <Badge className="gap-1 status-idle">
              <Clock className="w-3 h-3" />
              Idle
            </Badge>
          );
        case "inactive":
          return (
            <Badge variant="outline" className="gap-1 status-inactive-subtle">
              <MinusCircle className="w-3 h-3" />
              Inactive
            </Badge>
          );
        default:
          return null;
      }
    })();

    if (withTooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipContent(status)}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return badgeContent;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-600";
      case "idle": return "text-orange-600";
      case "inactive": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const handleStatusChange = (agentId: string, newStatus: "active" | "idle" | "inactive") => {
    onUpdateAgentStatus(agentId, newStatus);
  };

  const handleCreateAgent = () => {
    if (onCreateAgent) {
      onCreateAgent();
    }
  };

  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.status === "active").length;
  const idleAgents = agents.filter(a => a.status === "idle").length;
  const inactiveAgents = agents.filter(a => a.status === "inactive").length;
  const totalUsage = agents.reduce((sum, agent) => sum + agent.usageCount, 0);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Enhanced Header with Improved Create Agent Button */}
        <div className="flex-shrink-0 p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                <div className="text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Sub Agent Manager</h1>
                <p className="text-muted-foreground">
                  Manage agent status and orchestration settings
                </p>
              </div>
            </div>
            
            {/* Enhanced Create Agent Button */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Ready to expand?</p>
                <p className="text-xs text-muted-foreground">Create specialized AI agents</p>
              </div>
              <Button 
                onClick={handleCreateAgent}
                className="gap-2 relative overflow-hidden group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                size="lg"
              >
                <div className="flex items-center gap-2 relative z-10">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </div>
                  <span className="font-medium">Create Agent</span>
                  <Sparkles className="w-4 h-4 opacity-75" />
                </div>
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Button>
            </div>
          </div>

          {/* Compact Stats */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            <Card className="p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-foreground">{totalAgents}</p>
                  <p className="text-xs text-muted-foreground">Total Agents</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </Card>
            
            <Card className="p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-green-600">{activeAgents}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-orange-600">{idleAgents}</p>
                  <p className="text-xs text-muted-foreground">Idle</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </Card>

            <Card className="p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-gray-600">{inactiveAgents}</p>
                  <p className="text-xs text-muted-foreground">Inactive</p>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <MinusCircle className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </Card>

            <Card className="p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-purple-600">{totalUsage}</p>
                  <p className="text-xs text-muted-foreground">Total Usage</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Collapsible Status Guide */}
          <Collapsible open={showStatusGuide} onOpenChange={setShowStatusGuide}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-between mb-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Agent Status Guide</span>
                </div>
                {showStatusGuide ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="p-4 mb-4 bg-gradient-to-br from-gray-50 to-gray-100/50">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Active</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Automatically participates in conversations via the orchestrator system
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <span className="font-medium text-orange-700">Idle</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only responds when explicitly mentioned with @agent-name
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MinusCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Inactive</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Completely disabled and cannot be called or participate
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Content with more space for agent list */}
        <div className="flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex-shrink-0 px-6 pt-4">
              <TabsList>
                <TabsTrigger value="agents">Agent List</TabsTrigger>
                <TabsTrigger value="orchestration">Orchestration</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 px-6 pb-6">
              <TabsContent value="agents" className="h-full">
                <div className="space-y-3 h-full flex flex-col">
                  {/* Compact Filters */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search agents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.label} ({category.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.label} ({status.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Status indicators in filters */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <Clock className="w-3 h-3 text-orange-600" />
                      <MinusCircle className="w-3 h-3 text-gray-600" />
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Hover over status badges for details</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Agent Grid - Now takes more space */}
                  <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                        {filteredAgents.map((agent) => (
                          <Card key={agent.id} className="p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02] border border-gray-200">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                  {getCategoryIcon(agent.category)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-foreground truncate text-sm">{agent.name}</h3>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {agent.category}
                                  </p>
                                </div>
                              </div>
                              {getStatusBadge(agent.status, true)}
                            </div>

                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                              {agent.description}
                            </p>

                            <div className="space-y-1.5 mb-3 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Usage:</span>
                                <span className="font-medium">{agent.usageCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Used:</span>
                                <span className="font-medium">
                                  {agent.lastUsed ? agent.lastUsed.toLocaleDateString() : "Never"}
                                </span>
                              </div>
                            </div>

                            {/* Status Control */}
                            <div className="space-y-2">
                              <Select 
                                value={agent.status} 
                                onValueChange={(value: "active" | "idle" | "inactive") => 
                                  handleStatusChange(agent.id, value)
                                }
                              >
                                <SelectTrigger className="w-full h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                      Active
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="idle">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-3 h-3 text-orange-600" />
                                      Idle
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="inactive">
                                    <div className="flex items-center gap-2">
                                      <MinusCircle className="w-3 h-3 text-gray-600" />
                                      Inactive
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>

                              <div className="flex gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 h-7 text-xs hover:bg-blue-50 hover:border-blue-200"
                                  onClick={() => onOpenChat(parseInt(agent.id.split('-')[2]), agent.name, agent.preset)}
                                >
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  Chat
                                </Button>
                                <Button variant="outline" size="sm" className="h-7 px-2 hover:bg-gray-50">
                                  <Settings className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orchestration" className="h-full">
                <div className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">Orchestration Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-foreground">Auto-Orchestration</label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Allow the system to automatically route messages to active agents
                        </p>
                        <Select defaultValue="enabled">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">Enabled</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">Active Agents</h3>
                    <div className="space-y-2">
                      {agents.filter(a => a.status === "active").map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-2 status-active-subtle rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                              {getCategoryIcon(agent.category)}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">{agent.name}</span>
                              <p className="text-xs text-muted-foreground">{agent.description}</p>
                            </div>
                          </div>
                          <Badge className="status-active">Active</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="h-full">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium text-foreground mb-3">Most Used Agents</h4>
                    <div className="space-y-2">
                      {agents
                        .sort((a, b) => b.usageCount - a.usageCount)
                        .slice(0, 5)
                        .map((agent) => (
                          <div key={agent.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">{agent.name}</span>
                            <span className="text-sm text-muted-foreground">{agent.usageCount} uses</span>
                          </div>
                        ))}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium text-foreground mb-3">Status Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Active</span>
                        </div>
                        <span className="text-sm font-medium">{activeAgents} agents</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-sm">Idle</span>
                        </div>
                        <span className="text-sm font-medium">{idleAgents} agents</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MinusCircle className="w-4 h-4 text-gray-600" />
                          <span className="text-sm">Inactive</span>
                        </div>
                        <span className="text-sm font-medium">{inactiveAgents} agents</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}