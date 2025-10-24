import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const integrations = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync call notes, action items, and insights to HubSpot CRM',
    category: 'CRM',
    connected: true,
    icon: '🔷',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Automatically update opportunities and contacts in Salesforce',
    category: 'CRM',
    connected: false,
    comingSoon: true,
    icon: '☁️',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Automatically join and record Zoom meetings',
    category: 'Video',
    connected: true,
    icon: '📹',
  },
  {
    id: 'meet',
    name: 'Google Meet',
    description: 'Join and transcribe Google Meet calls seamlessly',
    category: 'Video',
    connected: false,
    comingSoon: true,
    icon: '🎥',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get real-time alerts and share call summaries in Slack',
    category: 'Messaging',
    connected: false,
    icon: '💬',
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    description: 'Automatically detect and join scheduled meetings',
    category: 'Calendar',
    connected: false,
    icon: '📅',
  },
];

const Integrations = () => {
  const handleConnect = (integrationId: string) => {
    toast({
      title: 'Integration connected',
      description: `${integrationId} has been connected successfully`,
    });
  };

  const handleDisconnect = (integrationId: string) => {
    toast({
      title: 'Integration disconnected',
      description: `${integrationId} has been disconnected`,
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-primary">Integrations</h1>
        <p className="text-subtext text-lg">Connect Echo with your favorite tools and platforms</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration, idx) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="card-elevated bg-white p-6 h-full flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  {integration.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-primary">{integration.name}</h3>
                    {integration.connected && (
                      <Badge className="status-badge-success">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                    {integration.comingSoon && (
                      <Badge variant="outline" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs mb-2">
                    {integration.category}
                  </Badge>
                  <p className="text-sm text-subtext">{integration.description}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 flex gap-2">
                {integration.connected ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-border text-primary hover:bg-muted"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => handleDisconnect(integration.id)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : integration.comingSoon ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="flex-1 border-border text-subtext"
                  >
                    Coming Soon
                  </Button>
                ) : (
                  <Button
                    className="btn-accent flex-1"
                    size="sm"
                    onClick={() => handleConnect(integration.id)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Integrations;
