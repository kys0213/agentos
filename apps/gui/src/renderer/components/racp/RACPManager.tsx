import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import {
  Network,
  Globe,
  Shield,
  Zap,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Users,
} from 'lucide-react';

export function RACPManager() {
  const roadmapItems = [
    {
      phase: 'Phase 1',
      title: 'Core Protocol Implementation',
      status: 'in-progress',
      completion: 75,
      items: [
        { name: 'Basic RPC Framework', done: true },
        { name: 'Authentication Layer', done: true },
        { name: 'Message Serialization', done: true },
        { name: 'Error Handling', done: false },
        { name: 'Connection Pool', done: false },
      ],
      timeline: 'Q1 2024',
    },
    {
      phase: 'Phase 2',
      title: 'Security & Discovery',
      status: 'planned',
      completion: 0,
      items: [
        { name: 'Agent Discovery Service', done: false },
        { name: 'Capability Negotiation', done: false },
        { name: 'End-to-End Encryption', done: false },
        { name: 'Rate Limiting', done: false },
        { name: 'Audit Logging', done: false },
      ],
      timeline: 'Q2 2024',
    },
    {
      phase: 'Phase 3',
      title: 'Advanced Features',
      status: 'planned',
      completion: 0,
      items: [
        { name: 'Multi-hop Routing', done: false },
        { name: 'Load Balancing', done: false },
        { name: 'Circuit Breakers', done: false },
        { name: 'Metrics & Monitoring', done: false },
        { name: 'WebRTC P2P Support', done: false },
      ],
      timeline: 'Q3 2024',
    },
  ];

  const features = [
    {
      icon: <Network className="w-6 h-6" />,
      title: 'Distributed Agent Network',
      description: 'Connect agents across multiple instances and organizations seamlessly',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Security First',
      description: 'Built-in authentication, authorization, and encryption for all communications',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'High Performance',
      description: 'Optimized for low latency with connection pooling and efficient serialization',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Protocol Agnostic',
      description: 'Works over HTTP/2, WebSocket, gRPC, and custom transport protocols',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">RACP</h1>
                <p className="text-sm text-muted-foreground">Remote Agent Call Protocol</p>
              </div>
              <Badge variant="outline" className="status-idle-subtle">
                Coming Soon
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Documentation
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Users className="w-4 h-4" />
              Join Beta
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          RACP enables seamless communication between AgentOS instances across networks, allowing
          agents to discover, authenticate, and collaborate with remote agents while maintaining
          security and performance standards.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 p-6 space-y-8">
        {/* Key Features */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="text-purple-600">{feature.icon}</div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Development Roadmap */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">Development Roadmap</h2>
          <div className="space-y-6">
            {roadmapItems.map((phase, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(phase.status)}
                    <h3 className="text-lg font-semibold text-foreground">
                      {phase.phase}: {phase.title}
                    </h3>
                    <Badge className={`text-xs border ${getStatusColor(phase.status)}`}>
                      {(() => {
                        if (phase.status === 'in-progress') {
                          return 'In Progress';
                        }
                        if (phase.status === 'completed') {
                          return 'Completed';
                        }
                        return 'Planned';
                      })()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{phase.timeline}</span>
                  </div>
                </div>

                {phase.completion > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>Progress</span>
                      <span>{phase.completion}%</span>
                    </div>
                    <Progress value={phase.completion} className="h-2" />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {phase.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-2 text-sm">
                      {item.done ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-300 rounded-sm flex-shrink-0" />
                      )}
                      <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Architecture Preview */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">Architecture Overview</h2>
          <Card className="p-6">
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-8">
                <div className="flex justify-center items-center space-x-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mb-2">
                      <Network className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm font-medium">AgentOS Instance A</p>
                  </div>

                  <div className="flex-1 flex items-center">
                    <Separator className="flex-1" />
                    <div className="mx-4 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      RACP
                    </div>
                    <Separator className="flex-1" />
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mb-2">
                      <Network className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm font-medium">AgentOS Instance B</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Secure, authenticated communication between distributed agent networks
                </p>
                <Button variant="outline" className="gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Learn More About RACP
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Beta Program */}
        <section>
          <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Join the Beta Program
                </h3>
                <p className="text-muted-foreground">
                  Get early access to RACP features and help shape the future of distributed agent
                  communication.
                </p>
              </div>
              <Button className="gap-2">
                <Calendar className="w-4 h-4" />
                Request Beta Access
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
