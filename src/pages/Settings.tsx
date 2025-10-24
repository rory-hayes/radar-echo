import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Download, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

const Settings = () => {
  const [orgName, setOrgName] = useState('Acme Corp');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [slackNotifs, setSlackNotifs] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [retention, setRetention] = useState([90]);

  const handleSave = () => {
    toast({ title: 'Settings saved successfully' });
  };

  const handleExportData = () => {
    const data = {
      organization: orgName,
      settings: {
        emailNotifications: emailNotifs,
        slackNotifications: slackNotifs,
        autoSync,
        retention: retention[0],
      },
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'echo-data-export.json';
    a.click();
    toast({ title: 'Data exported successfully' });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-primary">Settings</h1>
        <p className="text-subtext text-lg">Manage your account and preferences</p>
      </motion.div>

      <div className="space-y-6">
        <Card className="card-elevated bg-white p-6">
          <h2 className="text-xl font-bold mb-4 text-primary">Organization</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="org-name" className="text-primary">Organization Name</Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="mt-2 bg-white border-border"
              />
            </div>
          </div>
        </Card>

        <Card className="card-elevated bg-white p-6">
          <h2 className="text-xl font-bold mb-4 text-primary">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifs" className="text-primary">Email Notifications</Label>
                <p className="text-sm text-subtext">Receive email summaries after each call</p>
              </div>
              <Switch
                id="email-notifs"
                checked={emailNotifs}
                onCheckedChange={setEmailNotifs}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="slack-notifs" className="text-primary">Slack Notifications</Label>
                <p className="text-sm text-subtext">Get alerts in Slack for completed calls</p>
              </div>
              <Switch
                id="slack-notifs"
                checked={slackNotifs}
                onCheckedChange={setSlackNotifs}
              />
            </div>
          </div>
        </Card>

        <Card className="card-elevated bg-white p-6">
          <h2 className="text-xl font-bold mb-4 text-primary">Integrations</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync" className="text-primary">Auto-sync to CRM</Label>
                <p className="text-sm text-subtext">Automatically sync completed calls to HubSpot</p>
              </div>
              <Switch
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
            </div>
          </div>
        </Card>

        <Card className="card-elevated bg-white p-6">
          <h2 className="text-xl font-bold mb-4 text-primary">Data & Privacy</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-primary">Data Retention</Label>
                <span className="text-sm font-semibold text-primary">{retention[0]} days</span>
              </div>
              <Slider
                value={retention}
                onValueChange={setRetention}
                min={30}
                max={365}
                step={30}
                className="my-4"
              />
              <p className="text-sm text-subtext">
                Call data will be automatically deleted after {retention[0]} days
              </p>
            </div>
            <Separator />
            <div>
              <Label className="text-primary mb-2 block">Data Region</Label>
              <p className="text-sm text-subtext mb-4">
                Your data is stored in: <span className="font-semibold text-primary">US East (N. Virginia)</span>
              </p>
            </div>
            <Separator />
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-border text-primary hover:bg-muted"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4 mr-2" />
                Export My Data
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-destructive text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Data
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            className="border-border text-primary hover:bg-muted"
          >
            Cancel
          </Button>
          <Button className="btn-accent" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
