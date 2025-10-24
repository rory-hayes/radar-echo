import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/lib/mock/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Plus, Copy, Download, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const Frameworks = () => {
  const queryClient = useQueryClient();

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => mockApi.listFrameworks(),
  });

  const setActiveMutation = useMutation({
    mutationFn: (id: string) => mockApi.setActiveFramework(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frameworks'] });
      toast({ title: 'Active framework updated' });
    },
  });

  const activeFramework = frameworks.find((f) => f.isActive);

  const handleDuplicate = (framework: any) => {
    const newFramework = {
      ...framework,
      id: `framework-${Date.now()}`,
      name: `${framework.name} (Copy)`,
      isActive: false,
    };
    mockApi.saveFramework(newFramework).then(() => {
      queryClient.invalidateQueries({ queryKey: ['frameworks'] });
      toast({ title: 'Framework duplicated' });
    });
  };

  const handleExport = (framework: any) => {
    const blob = new Blob([JSON.stringify(framework, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${framework.id}.json`;
    a.click();
    toast({ title: 'Framework exported' });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-primary">Frameworks</h1>
        <p className="text-subtext text-lg">Configure your discovery frameworks and qualifying questions</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {frameworks.map((framework, idx) => (
          <motion.div
            key={framework.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={`card-elevated p-6 ${framework.isActive ? 'border-accent border-2' : 'bg-white'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-1">{framework.name}</h3>
                  <p className="text-sm text-subtext">Qualification framework</p>
                </div>
                {framework.isActive && (
                  <Badge className="bg-accent/10 text-accent border-accent/20">
                    <Check className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <div className="text-sm text-subtext">
                  <span className="font-semibold text-primary">{framework.fields.length}</span> fields
                </div>
                <div className="flex flex-wrap gap-1">
                  {framework.fields.slice(0, 4).map((field) => (
                    <Badge key={field.key} variant="outline" className="text-xs">
                      {field.label}
                    </Badge>
                  ))}
                  {framework.fields.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{framework.fields.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {!framework.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-border text-primary hover:bg-muted"
                    onClick={() => setActiveMutation.mutate(framework.id)}
                  >
                    Set Active
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-primary hover:bg-muted"
                  onClick={() => handleDuplicate(framework)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-primary hover:bg-muted"
                  onClick={() => handleExport(framework)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {activeFramework && (
        <Card className="card-elevated bg-white p-8">
          <h2 className="text-2xl font-bold mb-6 text-primary">{activeFramework.name} - Fields</h2>
          <div className="space-y-6">
            {activeFramework.fields.map((field) => (
              <div key={field.key} className="border border-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-primary">{field.label}</h3>
                    {field.required && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-subtext mb-4">{field.prompt}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-6 flex gap-3">
        <Button className="btn-accent">
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Framework
        </Button>
        <Button variant="outline" className="border-border text-primary hover:bg-muted">
          <Upload className="w-4 h-4 mr-2" />
          Import Framework
        </Button>
      </div>
    </div>
  );
};

export default Frameworks;
